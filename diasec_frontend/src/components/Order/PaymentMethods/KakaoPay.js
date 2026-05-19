import { toast } from 'react-toastify';

const requestKakaoPay = ({ ordererName, phone, email, amount, onSuccess, onFail }) => {
    if (!window.IMP) {
        const script = document.createElement('script');
        script.src = 'https://cdn.iamport.kr/js/iamport.payment-1.2.0.js';
        script.async = true;

        script.onload = () => {
            runPayment();
        };
        script.onerror = () => {
            toast.error('결제 모듈 로딩 실패');
            if (onFail) onFail();
        };

        document.body.appendChild(script);
    } else {
        runPayment();
    }

    function runPayment () {
        const IMP = window.IMP;
        if (!IMP) {
            toast.error('결제 모듈이 아직 로드되지 않았습니다.');
            return;
        }

        IMP.init('imp52371161'); // ← 본인 가맹점 코드

        IMP.request_pay({
            pg: 'kakaopay',
            pay_method: 'card',
            merchant_uid: `mid_${new Date().getTime()}`,
            name: '주문명: 쇼핑몰 결제',
            amount: amount,
            buyer_email: email,
            buyer_name: ordererName,
            buyer_tel: phone,
        }, function (rsp) {
            if (rsp.success) {
                onSuccess?.(rsp);
            } else {
                onFail?.(rsp);
            }
        });
    };
};

export default requestKakaoPay;
