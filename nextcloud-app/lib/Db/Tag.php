<?php

declare(strict_types=1);

namespace OCA\GilbertsTodo\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method string getId()
 * @method void setId(string $id)
 * @method string getUserId()
 * @method void setUserId(string $userId)
 * @method string getName()
 * @method void setName(string $name)
 * @method string getColor()
 * @method void setColor(string $color)
 * @method bool getIsDefault()
 * @method void setIsDefault(bool $isDefault)
 * @method string|null getParentId()
 * @method void setParentId(?string $parentId)
 */
class Tag extends Entity {
    protected string $userId = '';
    protected string $name = '';
    protected string $color = '';
    protected bool $isDefault = false;
    protected ?string $parentId = null;

    public function __construct() {
        $this->addType('isDefault', 'boolean');
    }

    public function jsonSerialize(): array {
        return [
            'id' => $this->getId(),
            'name' => $this->getName(),
            'color' => $this->getColor(),
            'isDefault' => $this->getIsDefault(),
            'parentId' => $this->getParentId(),
        ];
    }
}
