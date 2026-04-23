<?php 
class subscription {

    public $id;
    public $userId;
    public $plan;
    public $amount;
    public $currency;
    public $status;
    public $promoCode;
    public $startedAt;
    public $expiresAt;

    public function __construct($userId,$plan,$amount,$currency,$status,$promoCode){
        $this->userId = $userId;
        $this->plan = $plan;
        $this->amount = $amount;
        $this->currency = $currency;
        $this->status = $status;
        $this->promoCode = $promoCode;
    }
}
?>