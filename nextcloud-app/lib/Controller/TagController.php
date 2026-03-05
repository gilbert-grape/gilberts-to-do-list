<?php

declare(strict_types=1);

namespace OCA\GilbertsTodo\Controller;

use OCA\GilbertsTodo\Db\Tag;
use OCA\GilbertsTodo\Db\TagMapper;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IRequest;

class TagController extends Controller {
    public function __construct(
        string $appName,
        IRequest $request,
        private TagMapper $mapper,
        private string $userId,
    ) {
        parent::__construct($appName, $request);
    }

    #[NoAdminRequired]
    public function health(): JSONResponse {
        return new JSONResponse(['status' => 'ok']);
    }

    #[NoAdminRequired]
    public function index(): JSONResponse {
        return new JSONResponse($this->mapper->findAll($this->userId));
    }

    #[NoAdminRequired]
    public function create(): JSONResponse {
        $data = $this->request->getParams();
        $tag = new Tag();
        $tag->setId($data['id'] ?? \OC::$server->getSecureRandom()->generate(36));
        $tag->setUserId($this->userId);
        $tag->setName($data['name'] ?? '');
        $tag->setColor($data['color'] ?? '#3b82f6');
        $tag->setIsDefault(!empty($data['isDefault']));
        $tag->setParentId($data['parentId'] ?? null);
        $tag = $this->mapper->insert($tag);
        return new JSONResponse($tag, 201);
    }

    #[NoAdminRequired]
    public function update(string $id): JSONResponse {
        $tag = $this->mapper->findById($id, $this->userId);
        $data = $this->request->getParams();
        if (isset($data['name'])) $tag->setName($data['name']);
        if (isset($data['color'])) $tag->setColor($data['color']);
        if (array_key_exists('isDefault', $data)) $tag->setIsDefault(!empty($data['isDefault']));
        if (array_key_exists('parentId', $data)) $tag->setParentId($data['parentId']);
        $this->mapper->update($tag);
        return new JSONResponse(['ok' => true]);
    }

    #[NoAdminRequired]
    public function destroy(string $id): JSONResponse {
        $tag = $this->mapper->findById($id, $this->userId);
        $this->mapper->delete($tag);
        return new JSONResponse(['ok' => true]);
    }
}
