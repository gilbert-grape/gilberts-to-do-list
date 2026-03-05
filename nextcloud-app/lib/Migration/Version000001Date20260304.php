<?php

declare(strict_types=1);

namespace OCA\GilbertsTodo\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version000001Date20260304 extends SimpleMigrationStep {
    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        if (!$schema->hasTable('gilbertstodo_tags')) {
            $table = $schema->createTable('gilbertstodo_tags');
            $table->addColumn('id', Types::STRING, ['notnull' => true, 'length' => 64]);
            $table->addColumn('user_id', Types::STRING, ['notnull' => true, 'length' => 64]);
            $table->addColumn('name', Types::STRING, ['notnull' => true, 'length' => 255]);
            $table->addColumn('color', Types::STRING, ['notnull' => true, 'length' => 32]);
            $table->addColumn('is_default', Types::BOOLEAN, ['notnull' => true, 'default' => false]);
            $table->addColumn('parent_id', Types::STRING, ['notnull' => false, 'length' => 64]);
            $table->setPrimaryKey(['id']);
            $table->addIndex(['user_id'], 'gilbertstodo_tags_uid');
        }

        if (!$schema->hasTable('gilbertstodo_todos')) {
            $table = $schema->createTable('gilbertstodo_todos');
            $table->addColumn('id', Types::STRING, ['notnull' => true, 'length' => 64]);
            $table->addColumn('user_id', Types::STRING, ['notnull' => true, 'length' => 64]);
            $table->addColumn('title', Types::STRING, ['notnull' => true, 'length' => 512]);
            $table->addColumn('description', Types::TEXT, ['notnull' => false]);
            $table->addColumn('parent_id', Types::STRING, ['notnull' => false, 'length' => 64]);
            $table->addColumn('status', Types::STRING, ['notnull' => true, 'default' => 'open', 'length' => 32]);
            $table->addColumn('due_date', Types::STRING, ['notnull' => false, 'length' => 64]);
            $table->addColumn('recurrence', Types::STRING, ['notnull' => false, 'length' => 32]);
            $table->addColumn('recurrence_interval', Types::INTEGER, ['notnull' => false]);
            $table->addColumn('created_at', Types::STRING, ['notnull' => true, 'length' => 64]);
            $table->addColumn('completed_at', Types::STRING, ['notnull' => false, 'length' => 64]);
            $table->addColumn('sort_order', Types::INTEGER, ['notnull' => true, 'default' => 0]);
            $table->setPrimaryKey(['id']);
            $table->addIndex(['user_id'], 'gilbertstodo_todos_uid');
        }

        if (!$schema->hasTable('gilbertstodo_todo_tags')) {
            $table = $schema->createTable('gilbertstodo_todo_tags');
            $table->addColumn('id', Types::BIGINT, ['autoincrement' => true, 'notnull' => true]);
            $table->addColumn('todo_id', Types::STRING, ['notnull' => true, 'length' => 64]);
            $table->addColumn('tag_id', Types::STRING, ['notnull' => true, 'length' => 64]);
            $table->setPrimaryKey(['id']);
            $table->addIndex(['todo_id'], 'gilbertstodo_tt_todo');
            $table->addIndex(['tag_id'], 'gilbertstodo_tt_tag');
            $table->addUniqueIndex(['todo_id', 'tag_id'], 'gilbertstodo_tt_uniq');
        }

        if (!$schema->hasTable('gilbertstodo_settings')) {
            $table = $schema->createTable('gilbertstodo_settings');
            $table->addColumn('id', Types::BIGINT, ['autoincrement' => true, 'notnull' => true]);
            $table->addColumn('user_id', Types::STRING, ['notnull' => true, 'length' => 64]);
            $table->addColumn('key', Types::STRING, ['notnull' => true, 'length' => 128]);
            $table->addColumn('value', Types::TEXT, ['notnull' => true]);
            $table->setPrimaryKey(['id']);
            $table->addUniqueIndex(['user_id', 'key'], 'gilbertstodo_set_uk');
        }

        return $schema;
    }
}
