<?php
class Community {
    public $id;
    public $creatorId;
    public $name;
    public $description;
    public $memberCount;
    public $isPrivate;
    public $category;
   public $icon;
    public $tags;
    public $createdAt;

    public function __construct($creatorId, $name, $description, $icon = null, $isPrivate = false, $tags = null, $category = null) {
        $this->id = $this->generateUUID();  // Générer un UUID
        $this->creatorId = $creatorId;
        $this->name = $name;
        $this->description = $description;
        $this->icon = $icon;
        $this->isPrivate = $isPrivate;
        $this->tags = $tags;
        $this->category = $category;
        $this->memberCount = 1;
        $this->createdAt = date('Y-m-d H:i:s');
    }
    
    // Générer un UUID v4
    private function generateUUID() {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}
?>