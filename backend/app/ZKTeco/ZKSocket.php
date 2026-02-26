<?php

namespace App\ZKTeco;

use RuntimeException;

class ZKSocket
{
    private mixed  $socket   = null;
    private int    $session  = 0;
    private int    $replyId  = 0;

    public function __construct(
        private readonly string $ip,
        private readonly int    $port    = 4370,
        private readonly int    $timeout = 5
    ) {}

    // ── Public API ────────────────────────────────────────────────

    public function connect(): bool
    {
        $this->socket = @fsockopen('tcp://'.$this->ip, $this->port, $errno, $errstr, $this->timeout);
        if (!$this->socket) {
            throw new RuntimeException("ZKTeco connect failed [{$this->ip}:{$this->port}]: {$errstr}");
        }

        stream_set_timeout($this->socket, $this->timeout);

        $reply = $this->sendCommand(ZKConstants::CMD_CONNECT, '');
        if (!$reply) {
            throw new RuntimeException('ZKTeco handshake failed');
        }

        $this->session = $this->extractSession($reply);
        return true;
    }

    public function disconnect(): void
    {
        if ($this->socket) {
            $this->sendCommand(ZKConstants::CMD_EXIT, '');
            fclose($this->socket);
            $this->socket = null;
        }
    }

    public function disableDevice(): void
    {
        $this->sendCommand(ZKConstants::CMD_DISABLEDEVICE, pack('H*', 'FFFF'));
    }

    public function enableDevice(): void
    {
        $this->sendCommand(ZKConstants::CMD_ENABLEDEVICE, '');
    }

    /**
     * Fetch all attendance records from the device.
     * Returns array of ['user_id', 'timestamp', 'punch']
     */
    public function getAttendance(): array
    {
        $raw = $this->sendCommand(ZKConstants::CMD_GET_ATTENDANCE, '');
        if (!$raw) return [];
        return $this->parseAttendanceRecords(substr($raw, ZKConstants::HEADER_SIZE));
    }

    // ── Packet Builder ────────────────────────────────────────────

    private function buildPacket(int $command, string $data): string
    {
        $this->replyId = ($this->replyId + 1) & 0xFFFF;
        $size = strlen($data);

        // Header: start(4) + command(2) + checksum(2) + session(2) + reply(2)
        $header = pack('VSSSSS',
            ZKConstants::START_TAG,
            $command,
            0,                   // checksum placeholder
            $this->session,
            $this->replyId,
            $size
        );

        $packet   = $header . $data;
        $checksum = $this->checksum($packet);

        // Inject real checksum at offset 6
        $packet = substr_replace($packet, pack('S', $checksum), 6, 2);
        return $packet;
    }

    private function sendCommand(int $cmd, string $data): ?string
    {
        if (!$this->socket) {
            throw new RuntimeException('Not connected');
        }

        $packet = $this->buildPacket($cmd, $data);
        fwrite($this->socket, $packet);

        $header = fread($this->socket, ZKConstants::HEADER_SIZE);
        if (!$header || strlen($header) < ZKConstants::HEADER_SIZE) return null;

        $parsed  = unpack('VstartTag/vcommand/vchecksum/vsession/vreplyId/vdataSize', $header);
        $dataLen = $parsed['dataSize'] ?? 0;
        $body    = $dataLen > 0 ? fread($this->socket, $dataLen) : '';

        return $header . $body;
    }

    // ── Attendance Parser ─────────────────────────────────────────

    /**
     * ZKTeco attendance record layout (16 bytes each):
     * user_id(2) + state(1) + timestamp(4) + reserved(9)
     */
    private function parseAttendanceRecords(string $raw): array
    {
        $records    = [];
        $recordSize = 16;
        $count      = intdiv(strlen($raw), $recordSize);

        for ($i = 0; $i < $count; $i++) {
            $chunk  = substr($raw, $i * $recordSize, $recordSize);
            $fields = unpack('vuser_id/Cstate/Vtimestamp', $chunk);

            $records[] = [
                'user_id'   => (string) $fields['user_id'],
                'punch'     => (int)    $fields['state'],
                'timestamp' => $this->decodeTimestamp($fields['timestamp']),
            ];
        }

        return $records;
    }

    /**
     * ZKTeco encodes datetime as a single 32-bit integer.
     * Formula: ((year-2000)*12*31 + (month-1)*31 + day-1)*24*60*60
     *          + hour*3600 + minute*60 + second
     */
    private function decodeTimestamp(int $t): string
    {
        $second = $t % 60; $t = intdiv($t, 60);
        $minute = $t % 60; $t = intdiv($t, 60);
        $hour   = $t % 24; $t = intdiv($t, 24);
        $day    = $t % 31 + 1; $t = intdiv($t, 31);
        $month  = $t % 12 + 1; $t = intdiv($t, 12);
        $year   = $t + 2000;

        return sprintf('%04d-%02d-%02d %02d:%02d:%02d', $year, $month, $day, $hour, $minute, $second);
    }

    private function checksum(string $packet): int
    {
        $sum = 0;
        foreach (str_split($packet, 2) as $word) {
            if (strlen($word) === 2) {
                $sum += unpack('v', $word)[1];
            }
        }
        while ($sum > 0xFFFF) $sum = ($sum & 0xFFFF) + ($sum >> 16);
        return ~$sum & 0xFFFF;
    }

    private function extractSession(string $reply): int
    {
        if (strlen($reply) < 8) return 0;
        return unpack('vsession', substr($reply, 4, 2))['session'] ?? 0;
    }
}
