<?php

declare(strict_types=1);

namespace OCA\GilbertsTodo\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method string getUserId()
 * @method void setUserId(string $userId)
 * @method string getKey()
 * @method void setKey(string $key)
 * @method string getValue()
 * @method void setValue(string $value)
 */
class Setting extends Entity {
    protected string $userId = '';
    protected string $key = '';
    protected string $value = '';
}
