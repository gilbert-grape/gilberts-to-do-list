<?php

declare(strict_types=1);

namespace OCA\GilbertsTodo\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method string getTodoId()
 * @method void setTodoId(string $todoId)
 * @method string getTagId()
 * @method void setTagId(string $tagId)
 */
class TodoTag extends Entity {
    protected string $todoId = '';
    protected string $tagId = '';
}
