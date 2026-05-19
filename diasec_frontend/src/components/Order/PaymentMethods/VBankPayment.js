/**
 * [배포·동기화 주의] 나이스페이 가상계좌(webhook/returnUrl)가 운영 서버 API와 맞물려 있습니다. 로컬 복붙으로 덮어쓰기 금지.
 */

import { toast } from 'react-toastify';

const requestVBankPayment = ({ orderId, ordererName, phone, email, amount, onFail }) => {
  if (!window.AUTHNICE) {
    const script = document.createElement('script');
    script.src = 'https://pay.nicepay.co.kr/v1/js/';
    script.async = true;
    script.onload = () => runPayment();
    script.onerror = () => {
      toast.error('NicePay 결제 모듈 로딩 실패');
      if (onFail) onFail();
    };
    document.body.appendChild(script);
  } else {
    runPayment();
  }

  function runPayment() {
    window.AUTHNICE.requestPay({
      clientId: process.env.REACT_APP_NICEPAY_CLIENT_KEY,
      method: 'vbank', // ★ 가상계좌
      orderId: orderId,
      amount: amount,
      goodsName: '쇼핑몰 결제',
      buyerName: ordererName,
      buyerTel: phone,
      buyerEmail: email,

      vbankHolder: '디아섹',
        
      webhookUrl: `${process.env.REACT_APP_API_BASE_URL}/api/payment/nicepay/webhook/vbank`,
      returnUrl: `${process.env.REACT_APP_API_BASE_URL}/api/payment/nicepay/vbank/return`,

      fnError: function (result) {
        toast.error(result.errorMsg || '가상계좌 발급 실패');
        if (onFail) onFail(result);
      }
    });
  }
};

export default requestVBankPayment;