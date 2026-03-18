<?php

namespace App\Services;

use App\Models\PayrollRun;
use App\Models\User;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

/**
 * PayrollRunGuard - State machine enforcement
 * 
 * Single source of truth for payroll run state transitions.
 * Controllers MUST call these methods before any mutations.
 */
class PayrollRunGuard
{
    /**
     * Assert that the run can be edited
     * 
     * @throws ConflictHttpException if run is not editable
     */
    public function assertEditable(PayrollRun $run): void
    {
        if (!in_array($run->status, ['draft', 'rejected'])) {
            throw new ConflictHttpException(
                "Cannot edit payroll run in '{$run->status}' status. Only draft or rejected runs can be edited."
            );
        }
    }

    /**
     * Assert that the run can be submitted for approval
     * 
     * @throws ConflictHttpException if run is not submittable
     */
    public function assertSubmittable(PayrollRun $run): void
    {
        if (!in_array($run->status, ['draft', 'rejected'])) {
            throw new ConflictHttpException(
                "Cannot submit payroll run in '{$run->status}' status. Only draft or rejected runs can be submitted."
            );
        }

        if ($run->employees()->count() === 0) {
            throw new ConflictHttpException(
                "Cannot submit payroll run with no employees."
            );
        }
    }

    /**
     * Assert that the run can be approved by the given user
     * 
     * @throws ConflictHttpException if run is not in correct status
     * @throws AccessDeniedHttpException if user is not the approver
     */
    public function assertApprovable(PayrollRun $run, User $user): void
    {
        if ($run->status !== 'submitted') {
            throw new ConflictHttpException(
                "Can only approve payroll runs in 'submitted' status. Current status: '{$run->status}'."
            );
        }

        if ($run->approver_user_id !== $user->id) {
            throw new AccessDeniedHttpException(
                "You are not the assigned approver for this payroll run."
            );
        }
    }

    /**
     * Assert that the run can be rejected by the given user
     * 
     * @throws ConflictHttpException if run is not in correct status
     * @throws AccessDeniedHttpException if user is not the approver
     */
    public function assertRejectable(PayrollRun $run, User $user): void
    {
        if ($run->status !== 'submitted') {
            throw new ConflictHttpException(
                "Can only reject payroll runs in 'submitted' status. Current status: '{$run->status}'."
            );
        }

        if ($run->approver_user_id !== $user->id) {
            throw new AccessDeniedHttpException(
                "You are not the assigned approver for this payroll run."
            );
        }
    }

    /**
     * Assert that the run is not approved (for operations that can't be done on approved runs)
     * 
     * @throws ConflictHttpException if run is approved
     */
    public function assertNotApproved(PayrollRun $run): void
    {
        if ($run->status === 'approved') {
            throw new ConflictHttpException(
                "Cannot perform this operation on an approved payroll run. Approved runs are immutable."
            );
        }
    }

    /**
     * Assert that the run can be recalculated
     * 
     * @throws ConflictHttpException if run cannot be recalculated
     */
    public function assertRecalculatable(PayrollRun $run): void
    {
        $this->assertEditable($run);
    }

    /**
     * Assert that the run can be deleted
     * 
     * @throws ConflictHttpException if run cannot be deleted
     */
    public function assertDeletable(PayrollRun $run): void
    {
        if ($run->status === 'approved') {
            throw new ConflictHttpException(
                "Cannot delete an approved payroll run."
            );
        }

        if ($run->status === 'submitted') {
            throw new ConflictHttpException(
                "Cannot delete a submitted payroll run. Please reject it first."
            );
        }
    }
}
