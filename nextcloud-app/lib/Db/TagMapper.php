<?php

declare(strict_types=1);

namespace OCA\GilbertsTodo\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

/**
 * @extends QBMapper<Tag>
 */
class TagMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'gilbertstodo_tags', Tag::class);
    }

    /**
     * @return Tag[]
     */
    public function findAll(string $userId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')
            ->from($this->getTableName())
            ->where($qb->expr()->eq('user_id', $qb->createNamedParameter($userId)));
        return $this->findEntities($qb);
    }

    public function findById(string $id, string $userId): Tag {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')
            ->from($this->getTableName())
            ->where($qb->expr()->eq('id', $qb->createNamedParameter($id)))
            ->andWhere($qb->expr()->eq('user_id', $qb->createNamedParameter($userId)));
        return $this->findEntity($qb);
    }

    /**
     * Override insert to use TEXT primary key (no lastInsertId).
     */
    public function insert(\OCP\AppFramework\Db\Entity $entity): Tag {
        $qb = $this->db->getQueryBuilder();
        $qb->insert($this->getTableName())
            ->values([
                'id' => $qb->createNamedParameter($entity->getId()),
                'user_id' => $qb->createNamedParameter($entity->getUserId()),
                'name' => $qb->createNamedParameter($entity->getName()),
                'color' => $qb->createNamedParameter($entity->getColor()),
                'is_default' => $qb->createNamedParameter($entity->getIsDefault(), IQueryBuilder::PARAM_BOOL),
                'parent_id' => $qb->createNamedParameter($entity->getParentId()),
            ]);
        $qb->executeStatement();
        return $entity;
    }
}
