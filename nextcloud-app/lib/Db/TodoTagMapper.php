<?php

declare(strict_types=1);

namespace OCA\GilbertsTodo\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\IDBConnection;

/**
 * @extends QBMapper<TodoTag>
 */
class TodoTagMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'gilbertstodo_todo_tags', TodoTag::class);
    }

    /**
     * @return string[] tag IDs for a given todo
     */
    public function findTagIdsByTodoId(string $todoId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('tag_id')
            ->from($this->getTableName())
            ->where($qb->expr()->eq('todo_id', $qb->createNamedParameter($todoId)));
        $result = $qb->executeQuery();
        $tagIds = [];
        while ($row = $result->fetch()) {
            $tagIds[] = $row['tag_id'];
        }
        $result->closeCursor();
        return $tagIds;
    }

    /**
     * @return array<string, string[]> map of todoId => tagId[]
     */
    public function findAllGrouped(): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('todo_id', 'tag_id')
            ->from($this->getTableName());
        $result = $qb->executeQuery();
        $map = [];
        while ($row = $result->fetch()) {
            $map[$row['todo_id']][] = $row['tag_id'];
        }
        $result->closeCursor();
        return $map;
    }

    public function deleteByTodoId(string $todoId): void {
        $qb = $this->db->getQueryBuilder();
        $qb->delete($this->getTableName())
            ->where($qb->expr()->eq('todo_id', $qb->createNamedParameter($todoId)));
        $qb->executeStatement();
    }

    public function setTagIds(string $todoId, array $tagIds): void {
        $this->deleteByTodoId($todoId);
        foreach ($tagIds as $tagId) {
            $entity = new TodoTag();
            $entity->setTodoId($todoId);
            $entity->setTagId($tagId);
            parent::insert($entity);
        }
    }
}
