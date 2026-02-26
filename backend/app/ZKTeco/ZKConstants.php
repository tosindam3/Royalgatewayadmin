<?php

namespace App\ZKTeco;

class ZKConstants
{
    // Commands
    const CMD_CONNECT        = 1000;
    const CMD_EXIT           = 1001;
    const CMD_ENABLEDEVICE   = 1002;
    const CMD_DISABLEDEVICE  = 1003;
    const CMD_GET_ATTENDANCE = 13;
    const CMD_CLEAR_ATT      = 15;
    const CMD_ACK_OK         = 2000;
    const CMD_ACK_ERROR      = 2001;
    const CMD_ACK_UNAUTH     = 2002;

    // Packet structure
    const HEADER_SIZE   = 8;
    const START_TAG     = 0x5050827d;

    // Punch type → check type mapping
    const PUNCH_MAP = [
        0 => 'check_in',   // Check In
        1 => 'check_out',  // Check Out
        2 => 'check_out',  // Break Out
        3 => 'check_in',   // Break In
        4 => 'check_in',   // Overtime In
        5 => 'check_out',  // Overtime Out
    ];
}
