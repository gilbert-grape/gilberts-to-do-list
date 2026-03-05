<?php

declare(strict_types=1);

namespace OCA\GilbertsTodo\Controller;

use OCA\GilbertsTodo\Db\Todo;
use OCA\GilbertsTodo\Db\TodoMapper;
use OCA\GilbertsTodo\Db\TodoTagMapper;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IRequest;

class TodoController extends Controller {
    public function __construct(
        string $appName,
        IRequest $request,
        private TodoMapper $mapper,
        private TodoTagMapper $todoTagMapper,
        private string $userId,
    ) {
        parent::__construct($appName, $request);
    }

    #[NoAdminRequired]
    public function index(): JSONResponse {
        $todos = $this->mapper->findAll($this->userId);
        $tagMap = $this->todoTagMapper->findAllGrouped();
        foreach ($todos as $todo) {
            $todo->tagIds = $tagMap[$todo->getId()] ?? [];
        }
        return new JSONResponse($todos);
    }

    #[NoAdminRequired]
    public function create(): JSONResponse {
        $data = $this->request->getParams();
        $todo = new Todo();
        $todo->setId($data['id'] ?? \OC::$server->getSecureRandom()->generate(36));
        $todo->setUserId($this->userId);
        $todo->setTitle($data['title'] ?? '');
        $todo->setDescription($data['description'] ?? null);
        $todo->setParentId($data['parentId'] ?? null);
        $todo->setStatus($data['status'] ?? 'open');
        $todo->setDueDate($data['dueDate'] ?? null);
        $todo->setRecurrence($data['recurrence'] ?? null);
        $todo->setRecurrenceInterval(
            isset($data['recurrenceInterval']) ? (int)$data['recurrenceInterval'] : null
        );
        $todo->setCreatedAt($data['createdAt'] ?? (new \DateTime())->format('c'));
        $todo->setCompletedAt($data['completedAt'] ?? null);
        $todo->setSortOrder(
            isset($data['sortOrder'])
                ? (int)$data['sortOrder']
                : $this->mapper->getMaxSortOrder($this->userId) + 1
        );

        $todo = $this->mapper->insert($todo);

        $tagIds = $data['tagIds'] ?? [];
        if (!empty($tagIds)) {
            $this->todoTagMapper->setTagIds($todo->getId(), $tagIds);
        }
        $todo->tagIds = $tagIds;

        return new JSONResponse($todo, 201);
    }

    #[NoAdminRequired]
    public function update(string $id): JSONResponse {
        $todo = $this->mapper->findById($id, $this->userId);
        $data = $this->request->getParams();

        if (isset($data['title'])) $todo->setTitle($data['title']);
        if (array_key_exists('description', $data)) $todo->setDescription($data['description']);
        if (array_key_exists('parentId', $data)) $todo->setParentId($data['parentId']);
        if (isset($data['status'])) $todo->setStatus($data['status']);
        if (array_key_exists('dueDate', $data)) $todo->setDueDate($data['dueDate']);
        if (array_key_exists('recurrence', $data)) $todo->setRecurrence($data['recurrence']);
        if (array_key_exists('recurrenceInterval', $data)) {
            $todo->setRecurrenceInterval(
                $data['recurrenceInterval'] !== null ? (int)$data['recurrenceInterval'] : null
            );
        }
        if (array_key_exists('completedAt', $data)) $todo->setCompletedAt($data['completedAt']);
        if (isset($data['sortOrder'])) $todo->setSortOrder((int)$data['sortOrder']);
        if (isset($data['createdAt'])) $todo->setCreatedAt($data['createdAt']);

        $this->mapper->update($todo);

        if (array_key_exists('tagIds', $data)) {
            $this->todoTagMapper->setTagIds($id, $data['tagIds'] ?? []);
        }

        return new JSONResponse(['ok' => true]);
    }

    #[NoAdminRequired]
    public function destroy(string $id): JSONResponse {
        $todo = $this->mapper->findById($id, $this->userId);
        $this->todoTagMapper->deleteByTodoId($id);
        $this->mapper->delete($todo);
        return new JSONResponse(['ok' => true]);
    }
}
