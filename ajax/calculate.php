<?php
/**
 * AJAX: Server-side hashrate -> DOGE calculation.
 * (Client-side JS handles this too; this endpoint allows verification.)
 */
require_once __DIR__ . '/../includes/init.php';

$ghs = (float) ($_GET['ghs'] ?? $_POST['ghs'] ?? 0);
if ($ghs < 0) {
    $ghs = 0;
}

$cost = ghs_to_doge($ghs);

json_response([
    'success'        => true,
    'ghs'            => $ghs,
    'ghs_per_doge'   => ghs_per_doge(),
    'cost'           => round($cost, 8),
    'cost_formatted' => doge($cost, 4) . ' DOGE',
]);
