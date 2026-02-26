<?php

namespace App\Repositories;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

abstract class BaseRepository
{
    protected $model;

    public function __construct(Model $model)
    {
        $this->model = $model;
    }

    /**
     * Get paginated results with common filters
     */
    public function paginate(array $filters = [], int $perPage = 20)
    {
        $query = $this->model->newQuery();

        return $this->applyFilters($query, $filters)
            ->paginate($perPage);
    }

    /**
     * Apply common filters to the query
     */
    protected function applyFilters(Builder $query, array $filters): Builder
    {
        if (isset($filters['search'])) {
            $this->applySearch($query, $filters['search']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query;
    }

    /**
     * Override this in child classes for specific search logic
     */
    protected function applySearch(Builder $query, string $search): Builder
    {
        return $query;
    }
}
