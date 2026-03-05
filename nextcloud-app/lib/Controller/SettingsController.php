<?php

declare(strict_types=1);

namespace OCA\GilbertsTodo\Controller;

use OCA\GilbertsTodo\Db\SettingMapper;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IRequest;

class SettingsController extends Controller {
    public function __construct(
        string $appName,
        IRequest $request,
        private SettingMapper $mapper,
        private string $userId,
    ) {
        parent::__construct($appName, $request);
    }

    #[NoAdminRequired]
    public function index(): JSONResponse {
        return new JSONResponse($this->mapper->findAll($this->userId));
    }

    #[NoAdminRequired]
    public function update(): JSONResponse {
        $data = $this->request->getParams();
        foreach ($data as $key => $value) {
            if (in_array($key, ['_route', 'format'], true)) continue;
            $this->mapper->upsert($this->userId, $key, (string)$value);
        }
        return new JSONResponse(['ok' => true]);
    }
}
