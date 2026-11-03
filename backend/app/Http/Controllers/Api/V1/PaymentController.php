<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Sale;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index()
    {
        $payments = Payment::latest()->paginate(15);

        return ApiResponse::success($payments);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'sale_id' => ['required', 'integer'],
            'method' => ['required', 'string'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'status' => ['required', 'in:pending,paid,failed,refunded'],
        ]);

        $payment = Payment::create([
            'business_id' => $request->user()->business_id,
            'payable_type' => Sale::class,
            'payable_id' => $data['sale_id'],
            'user_id' => $request->user()->id,

            'method' => $data['method'],
            'amount' => $data['amount'],
            'received' => $data['amount'],
            'change_given' => 0,

            'currency' => 'USD',
            'exchange_rate' => 1,

            'status' => $data['status'],
            'paid_at' => now(),
        ]);

        return ApiResponse::success(
            $payment,
            'Payment created successfully.'
        );
    }

    public function show(int $id){
        $payment = Payment::findOrFail($id);

        return ApiResponse::success($payment);
    }

    public function update(Request $request, int $id)
    {
        $payment = Payment::findOrFail($id);

        $data = $request->validate([
            'status' => ['required', 'in:pending,paid,failed,refunded'],
        ]);

        $payment->update($data);

        return ApiResponse::success(
            $payment,
            'Payment updated successfully.'
        );
    }

    public function destroy(int $id){
        $payment = Payment::findOrFail($id);

        $payment->delete();

        return ApiResponse::success(
            null,
            'Payment deleted successfully.'
        );
    }
}