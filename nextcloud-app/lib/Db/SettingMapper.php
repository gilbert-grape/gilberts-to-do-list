<?php

declare(strict_types=1);

namespace OCA\GilbertsTodo\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\IDBConnection;

/**
 * @extends QBMapper<Setting>
 */
class SettingMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'gilbertstodo_settings', Setting::class);
    }

    /**
     * @return array<string, string>
     */
    public function findAll(string $userId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('key', 'value')
            ->from($this->getTableName())
            ->where($qb->expr()->eq('user_id', $qb->createNamedParameter($userId)));
        $result = $qb->executeQuery();
        $settings = [];
        while ($row = $result->fetch()) {
            $settings[$row['key']] = $row['value'];
        }
        $result->closeCursor();
        return $settings;
    }

    public function upsert(string $userId, string $key, string $value): void {
        // Try update first
        $qb = $this->db->getQueryBuilder();
        $qb->update($this->getTableName())
            ->set('value', $qb->createNamedParameter($value))
            ->where($qb->expr()->eq('user_id', $qb->createNamedParameter($userId)))
            ->andWhere($qb->expr()->eq('key', $qb->createNamedParameter($key)));
        $affected = $qb->executeStatement();

        if ($affected === 0) {
            $entity = new Setting();
            $entity->setUserId($userId);
            $entity->setKey($key);
            $entity->setValue($value);
            parent::insert($entity);
        }
    }
}
