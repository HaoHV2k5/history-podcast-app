#!/usr/bin/env bash
# ==============================================================================
# customer_sim.sh - Công cụ giả lập vai trò Khách hàng (Customer Simulation CLI)
# Dùng để test đầu cuối toàn bộ Milestone Escrow Flow mà không cần Mobile App
# ==============================================================================

BASE_URL="http://localhost:8080"
CUSTOMER_EMAIL="customer@example.com"
CUSTOMER_PASSWORD="Customer@123"

# 1. Login & Retrieve JWT
get_customer_token() {
  local token
  token=$(curl -s -X POST "${BASE_URL}/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${CUSTOMER_EMAIL}\",\"password\":\"${CUSTOMER_PASSWORD}\"}" \
    | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

  if [ -z "$token" ]; then
    echo "❌ Lỗi: Không thể đăng nhập tài khoản Customer (${CUSTOMER_EMAIL})." >&2
    exit 1
  fi
  echo "$token"
}

# 2. Deposit simulation via VNPay IPN
deposit() {
  local amount="${1:-5000000}"
  echo "👉 Đang tạo lệnh nạp ${amount} VNĐ vào ví Customer..."
  local token
  token=$(get_customer_token)

  local create_res
  create_res=$(curl -s -X POST "${BASE_URL}/api/v1/wallets/me/deposits" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d "{\"amount\":${amount},\"bankCode\":\"NCB\"}")

  local txn_ref
  txn_ref=$(echo "$create_res" | grep -o '"merchantTxnRef":"[^"]*' | cut -d'"' -f4)

  if [ -z "$txn_ref" ]; then
    echo "❌ Lỗi khởi tạo lệnh nạp: $create_res"
    exit 1
  fi

  # Calculate HMAC-SHA512 for VNPay IPN
  local ipn_url
  ipn_url=$(node -e "
    const crypto = require('crypto');
    const hashSecret = 'TESTHASHSECRET1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF';
    const params = {
      vnp_Amount: '${amount}00',
      vnp_BankCode: 'NCB',
      vnp_BankTranNo: 'VNP12345678',
      vnp_CardType: 'ATM',
      vnp_OrderInfo: 'Nap+tien+vao+vi+PRM',
      vnp_PayDate: '20261101213303',
      vnp_ResponseCode: '00',
      vnp_TmnCode: 'TESTTMN1',
      vnp_TransactionNo: '14567890',
      vnp_TransactionStatus: '00',
      vnp_TxnRef: '${txn_ref}'
    };
    const sortedKeys = Object.keys(params).sort();
    const hashData = sortedKeys.map(k => k + '=' + params[k]).join('&');
    const secureHash = crypto.createHmac('sha512', hashSecret).update(Buffer.from(hashData, 'utf-8')).digest('hex');
    params.vnp_SecureHash = secureHash;
    const query = Object.keys(params).map(k => k + '=' + params[k]).join('&');
    console.log('${BASE_URL}/api/v1/payments/vnpay/ipn?' + query);
  ")

  local ipn_res
  ipn_res=$(curl -s "$ipn_url")
  echo "✅ Nạp tiền thành công! Kết quả IPN: $ipn_res"
}

# 3. View Customer status & balance
status() {
  local token
  token=$(get_customer_token)
  echo "=== THÔNG TIN VÍ CUSTOMER (${CUSTOMER_EMAIL}) ==="
  curl -s "${BASE_URL}/api/v1/wallets/me" -H "Authorization: Bearer ${token}"
  echo ""
  echo "=== ĐƠN ĐẶT HÀNG ĐÃ GỬI (MY-SENT) ==="
  curl -s "${BASE_URL}/api/v1/commissions/my-sent" -H "Authorization: Bearer ${token}"
  echo ""
}

# 4. Customer sends commission to Creator Channel
send_commission() {
  local channel_id="${1:-6}"
  local title="${2:-Đặt làm Video: Nghệ thuật quân sự Trận Rạch Gầm Xoài Mút}"
  local desc="${3:-Khách đặt làm video phân tích chiến thuật mai phục và bố phòng hỏa hổ của Tây Sơn Nguyễn Huệ năm 1785.}"
  local token
  token=$(get_customer_token)

  echo "👉 Customer đang gửi đơn đặt hàng tới Kênh #${channel_id}..."
  curl -s -X POST "${BASE_URL}/api/v1/commissions" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d "{\"channelId\":${channel_id},\"contentType\":\"SINGLE_VIDEO\",\"title\":\"${title}\",\"description\":\"${desc}\"}"
  echo ""
}

# 5. Customer accepts contract roadmap
accept_contract() {
  local contract_id="$1"
  if [ -z "$contract_id" ]; then
    echo "Cách dùng: $0 accept-contract <contractId>"
    exit 1
  fi
  local token
  token=$(get_customer_token)
  echo "👉 Customer chấp thuận Lộ trình Milestone cho Hợp đồng #${contract_id}..."
  curl -s -X POST "${BASE_URL}/api/v1/contracts/${contract_id}/accept" \
    -H "Authorization: Bearer ${token}"
  echo ""
}

# 6. Customer rejects contract roadmap
reject_contract() {
  local contract_id="$1"
  if [ -z "$contract_id" ]; then
    echo "Cách dùng: $0 reject-contract <contractId>"
    exit 1
  fi
  local token
  token=$(get_customer_token)
  echo "👉 Customer từ chối Lộ trình Milestone cho Hợp đồng #${contract_id}..."
  curl -s -X POST "${BASE_URL}/api/v1/contracts/${contract_id}/reject" \
    -H "Authorization: Bearer ${token}"
  echo ""
}

# 7. Customer funds a milestone (moves money to Escrow HELD)
fund_milestone() {
  local milestone_id="$1"
  if [ -z "$milestone_id" ]; then
    echo "Cách dùng: $0 fund-milestone <milestoneId>"
    exit 1
  fi
  local token
  token=$(get_customer_token)
  echo "👉 Customer nạp tiền ký quỹ cho Milestone #${milestone_id} (UNFUNDED -> HELD)..."
  curl -s -X POST "${BASE_URL}/api/v1/milestones/${milestone_id}/fund" \
    -H "Authorization: Bearer ${token}"
  echo ""
}

# 8. Customer requests revision
request_revision() {
  local milestone_id="$1"
  local note="${2:-Nhờ Creator điều chỉnh âm lượng giọng đọc rõ hơn và kéo dài phần kết luận thêm 30 giây.}"
  if [ -z "$milestone_id" ]; then
    echo "Cách dùng: $0 request-revision <milestoneId> [lý_do_sửa]"
    exit 1
  fi
  local token
  token=$(get_customer_token)
  echo "👉 Customer yêu cầu chỉnh sửa cho Milestone #${milestone_id}..."
  curl -s -X POST "${BASE_URL}/api/v1/milestones/${milestone_id}/request-revision" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d "{\"note\":\"${note}\"}"
  echo ""
}

# 9. Customer approves milestone
approve_milestone() {
  local milestone_id="$1"
  if [ -z "$milestone_id" ]; then
    echo "Cách dùng: $0 approve-milestone <milestoneId>"
    exit 1
  fi
  local token
  token=$(get_customer_token)
  echo "👉 Customer duyệt nghiệm thu cho Milestone #${milestone_id} (SUBMITTED -> APPROVED)..."
  curl -s -X POST "${BASE_URL}/api/v1/milestones/${milestone_id}/approve" \
    -H "Authorization: Bearer ${token}"
  echo ""
}

# 10. Customer opens dispute
open_dispute() {
  local milestone_id="$1"
  local reason="${2:-Sản phẩm bàn giao không đúng kịch bản đã thống nhất trong Chat và trễ hạn nộp.}"
  if [ -z "$milestone_id" ]; then
    echo "Cách dùng: $0 open-dispute <milestoneId> [lý_do_khiếu_nại]"
    exit 1
  fi
  local token
  token=$(get_customer_token)
  echo "👉 Customer mở khiếu nại cho Milestone #${milestone_id}..."
  curl -s -X POST "${BASE_URL}/api/v1/disputes" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d "{\"milestoneId\":${milestone_id},\"reason\":\"${reason}\",\"evidence\":\"https://images.unsplash.com/photo-1589829545856-d10d557cf95f\"}"
  echo ""
}

# 11. Customer reviews milestone
review_milestone() {
  local milestone_id="$1"
  local rating="${2:-5}"
  local comment="${3:-Chất lượng video và giọng đọc thuyết minh trên cả tuyệt vời, bàn giao rất đúng hẹn!}"
  if [ -z "$milestone_id" ]; then
    echo "Cách dùng: $0 review-milestone <milestoneId> [rating 1..5] [nhận_xét]"
    exit 1
  fi
  local token
  token=$(get_customer_token)
  echo "👉 Customer gửi đánh giá ${rating} sao cho Milestone #${milestone_id}..."
  curl -s -X POST "${BASE_URL}/api/v1/milestones/${milestone_id}/reviews" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d "{\"rating\":${rating},\"comment\":\"${comment}\"}"
  echo ""
}

# Command dispatch
case "$1" in
  status)
    status
    ;;
  deposit)
    deposit "$2"
    ;;
  send-commission)
    send_commission "$2" "$3" "$4"
    ;;
  accept-contract)
    accept_contract "$2"
    ;;
  reject-contract)
    reject_contract "$2"
    ;;
  fund-milestone)
    fund_milestone "$2"
    ;;
  request-revision)
    request_revision "$2" "$3"
    ;;
  approve-milestone)
    approve_milestone "$2"
    ;;
  open-dispute)
    open_dispute "$2" "$3"
    ;;
  review-milestone)
    review_milestone "$2" "$3" "$4"
    ;;
  *)
    echo "================================================================="
    echo " SỬ KÝ - CUSTOMER SIMULATION CLI TOOL"
    echo " Dùng để đóng vai Khách hàng thực hiện các bước trong Milestone Flow"
    echo "================================================================="
    echo "Cách dùng:"
    echo "  $0 status                                    - Xem số dư ví và đơn đã gửi của Customer"
    echo "  $0 deposit [số_tiền]                         - Nạp tiền giả lập vào ví Customer"
    echo "  $0 send-commission [channelId] [title]       - Khách gửi đơn đặt hàng mới"
    echo "  $0 accept-contract <contractId>              - Khách chấp thuận Lộ trình Milestone"
    echo "  $0 reject-contract <contractId>              - Khách từ chối Lộ trình Milestone"
    echo "  $0 fund-milestone <milestoneId>              - Khách nạp cọc ký quỹ cho giai đoạn (HELD)"
    echo "  $0 request-revision <milestoneId> [ghi_chú]  - Khách yêu cầu chỉnh sửa bài nộp"
    echo "  $0 approve-milestone <milestoneId>           - Khách duyệt nghiệm thu giai đoạn (APPROVED)"
    echo "  $0 open-dispute <milestoneId> [lý_do]        - Khách mở khiếu nại (FROZEN tiền cọc)"
    echo "  $0 review-milestone <milestoneId> <sao> [bl] - Khách chấm 1-5 sao và nhận xét"
    echo "================================================================="
    ;;
esac

