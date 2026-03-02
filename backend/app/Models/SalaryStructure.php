<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalaryStructure extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'earnings_components',
        'deductions_components',
        'is_active',
    ];

    protected $casts = [
        'earnings_components' => 'array',
        'deductions_components' => 'array',
        'is_active' => 'boolean',
    ];

    public function employeeSalaries()
    {
        return $this->hasMany(EmployeeSalary::class);
    }
}
