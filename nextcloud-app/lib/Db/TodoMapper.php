<?php

declare(strict_types=1);

namespace OCA\GilbertsTodo\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

/**
 * @extends QBMapper<Todo>
 */
class TodoMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'gilbertstodo_todos', Todo::class);
    }

    /**
     * @return Todo[]
     */
    public function findAll(string $userId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')
            ->from($this->getTableName())
            ->where($qb->expr()->eq('user_id', $qb->createNamedParameter($userId)));
        return $this->findEntities($qb);
    }

    public function findById(string $id, string $userId): Todo {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')
            ->from($this->getTableName())
            ->where($qb->expr()->eq('id', $qb->createNamedParameter($id)))
            ->andWhere($qb->expr()->eq('user_id', $qb->createNamedParameter($userId)));
        return $this->findEntity($qb);
    }

    public function getMaxSortOrder(string $userId): int {
        $qb = $this->db->getQueryBuilder();
        $qb->select($qb->func()->max('sort_order'))
            ->from($this->getTableName())
            ->where($qb->expr()->eq('user_id', $qb->createNamedParameter($userId)));
        $result = $qb->executeQuery();
        $max = $result->fetchOne();
        $result->closeCursor();
        return $max !== false && $max !== null ? (int)$max : -1;
    }

    /**
     * Override insert to use TEXT primary key (no lastInsertId).
     */
    public function insert(\OCP\AppFramework\Db\Entity $entity): Todo {
        $qb = $this->db->getQueryBuilder();
        $qb->insert($this->getTableName())
            ->values([
                'id' => $qb->createNamedParameter($entity->getId()),
                'user_id' => $qb->createNamedParameter($entity->getUserId()),
                'title' => $qb->createNamedParameter($entity->getTitle()),
                'description' => $qb->createNamedParameter($entity->getDescription()),
                'parent_id' => $qb->createNamedParameter($entity->getParentId()),
                'status' => $qb->createNamedParameter($entity->getStatus()),
                'due_date' => $qb->createNamedParameter($entity->getDueDate()),
                'recurrence' => $qb->createNamedParameter($entity->getRecurrence()),
                'recurrence_interval' => $qb->createNamedParameter($entity->getRecurrenceInterval(), IQueryBuilder::PARAM_INT),
                'created_at' => $qb->createNamedParameter($entity->getCreatedAt()),
                'completed_at' => $qb->createNamedParameter($entity->getCompletedAt()),
                'sort_order' => $qb->createNamedParameter($entity->getSortOrder(), IQueryBuilder::PARAM_INT),
            ]);
        $qb->executeStatement();
        return $entity;
    }
}
