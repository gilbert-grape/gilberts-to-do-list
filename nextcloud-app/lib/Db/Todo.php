<?php

declare(strict_types=1);

namespace OCA\GilbertsTodo\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method string getId()
 * @method void setId(string $id)
 * @method string getUserId()
 * @method void setUserId(string $userId)
 * @method string getTitle()
 * @method void setTitle(string $title)
 * @method string|null getDescription()
 * @method void setDescription(?string $description)
 * @method string|null getParentId()
 * @method void setParentId(?string $parentId)
 * @method string getStatus()
 * @method void setStatus(string $status)
 * @method string|null getDueDate()
 * @method void setDueDate(?string $dueDate)
 * @method string|null getRecurrence()
 * @method void setRecurrence(?string $recurrence)
 * @method int|null getRecurrenceInterval()
 * @method void setRecurrenceInterval(?int $recurrenceInterval)
 * @method string getCreatedAt()
 * @method void setCreatedAt(string $createdAt)
 * @method string|null getCompletedAt()
 * @method void setCompletedAt(?string $completedAt)
 * @method int getSortOrder()
 * @method void setSortOrder(int $sortOrder)
 */
class Todo extends Entity {
    protected string $userId = '';
    protected string $title = '';
    protected ?string $description = null;
    protected ?string $parentId = null;
    protected string $status = 'open';
    protected ?string $dueDate = null;
    protected ?string $recurrence = null;
    protected ?int $recurrenceInterval = null;
    protected string $createdAt = '';
    protected ?string $completedAt = null;
    protected int $sortOrder = 0;

    /** @var string[] Populated by controller, not a DB column */
    public array $tagIds = [];

    public function __construct() {
        $this->addType('recurrenceInterval', 'integer');
        $this->addType('sortOrder', 'integer');
    }

    public function jsonSerialize(): array {
        return [
            'id' => $this->getId(),
            'title' => $this->getTitle(),
            'description' => $this->getDescription(),
            'tagIds' => $this->tagIds,
            'parentId' => $this->getParentId(),
            'status' => $this->getStatus(),
            'dueDate' => $this->getDueDate(),
            'recurrence' => $this->getRecurrence(),
            'recurrenceInterval' => $this->getRecurrenceInterval(),
            'createdAt' => $this->getCreatedAt(),
            'completedAt' => $this->getCompletedAt(),
            'sortOrder' => $this->getSortOrder(),
        ];
    }
}
