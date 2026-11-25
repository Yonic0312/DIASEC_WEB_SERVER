import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { calculateCumulativePrice } from '../../utils/customFramePrice';
import stampImg from '../../assets/stamp.png';

const SUPPLIER = {
    regNo: '357-78-00448',
    company: '디아섹코리아',
    name: '임정원',
    address: '경기도 고양시 덕양구 통일로 140',
    bizType: '제조',
    bizItem: '인테리어액자',
    phone: '010-4231-5879',
};

const won = (n) => Math.round(Number(n) || 0).toLocaleString('ko-KR');

const esc = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const normalizeRate = (value) => {
    if (value === '' || value == null) return 0;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(100, Math.round(n));
};

const parseSize = (size) => {
    const match = String(size || '').match(/([\d.]+)\s*[xX×]\s*([\d.]+)/);
    if (!match) return null;
    const w = parseFloat(match[1]);
    const h = parseFloat(match[2]);
    if (!w || !h) return null;
    return { w, h };
};

const specLabel = (size) => {
    const parsed = parseSize(size);
    if (!parsed) return (String(size || '').trim() || '');
    if (parsed.w <= 120 && parsed.h <= 120) {
        return `${Math.round(parsed.w * 2.54)}X${Math.round(parsed.h * 2.54)}`;
    }
    return `${Math.round(parsed.w)}X${Math.round(parsed.h)}`;
};

const calcListFromSize = (size) => {
    const parsed = parseSize(size);
    if (!parsed || parsed.w > 120 || parsed.h > 120) return 0;
    const wCm = Math.round(parsed.w * 2.54);
    const hCm = Math.round(parsed.h * 2.54);
    const area = wCm * hCm;
    if (area <= 0) return 0;
    return calculateCumulativePrice(area);
};

/** 견적 단가. 사이즈로 정가표를 되돌리고, 정가표가 결제단가보다 낮으면 결제단가를 쓴다. */
const itemListUnit = (item) => {
    const paid = Math.round(Number(item.price) || 0);
    const calculated = calcListFromSize(item.size);
    if (!calculated || calculated + 500 < paid) return paid;
    return calculated;
};

const toRow = (item) => {
    const qty = Number(item.quantity) || 0;
    const unit = itemListUnit(item);
    const name = (item.title || '').trim() || (item.category === 'customFrames' ? '디아섹액자' : '상품');
    return { name, spec: specLabel(item.size), qty, unit, supply: unit * qty };
};

export const inferDiscountPercent = (items) => {
    let listSum = 0;
    let paidSum = 0;
    (items || []).forEach((item) => {
        const qty = Number(item.quantity) || 0;
        const paid = Math.round(Number(item.price) || 0);
        const list = itemListUnit(item);
        if (list > paid) {
            listSum += list * qty;
            paidSum += paid * qty;
        }
    });
    if (listSum <= 0) return 0;
    const raw = (1 - paidSum / listSum) * 100;
    if (raw < 0.4) return 0;
    const steps = [0, 5, 10, 15, 20, 25, 30, 35, 40];
    let best = Math.round(raw);
    let bestDiff = Infinity;
    steps.forEach((step) => {
        const diff = Math.abs(step - raw);
        if (diff < bestDiff) {
            bestDiff = diff;
            best = step;
        }
    });
    if (bestDiff <= 1.2) return best;
    return Math.max(0, Math.min(40, Math.round(raw)));
};

const mergeRows = (rows) => {
    const map = new Map();
    rows.forEach((row) => {
        const key = `${row.name}|${row.spec}|${row.unit}`;
        const prev = map.get(key);
        if (prev) {
            prev.qty += row.qty;
            prev.supply += row.supply;
        } else {
            map.set(key, { ...row });
        }
    });
    return [...map.values()];
};

const buildGroups = (orders, rateByOid) => {
    const groups = [];
    const indexByRate = new Map();
    orders.forEach((order) => {
        const rate = normalizeRate(rateByOid[order.oid]);
        if (!indexByRate.has(rate)) {
            indexByRate.set(rate, groups.length);
            groups.push({ rate, oids: [], rows: [] });
        }
        const group = groups[indexByRate.get(rate)];
        group.oids.push(order.oid);
        (order.items || []).forEach((item) => group.rows.push(toRow(item)));
    });
    return groups.map((group) => {
        const rows = mergeRows(group.rows);
        const qty = rows.reduce((sum, row) => sum + row.qty, 0);
        const supply = rows.reduce((sum, row) => sum + row.supply, 0);
        const discount = Math.round(supply * group.rate / 100);
        return {
            ...group,
            rows,
            qty,
            supply,
            discount,
            net: supply - discount,
        };
    });
};

const koreanWon = (amount) => {
    const n = Math.round(Number(amount) || 0);
    if (n <= 0) return '영원정';
    const digits = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
    const small = ['', '십', '백', '천'];
    const big = ['', '만', '억', '조'];
    const text = String(n);
    const groups = [];
    for (let i = text.length; i > 0; i -= 4) {
        groups.unshift(text.slice(Math.max(0, i - 4), i));
    }
    let result = '';
    groups.forEach((group, index) => {
        const padded = group.padStart(4, '0');
        let part = '';
        for (let i = 0; i < 4; i += 1) {
            const digit = Number(padded[i]);
            if (!digit) continue;
            const unit = small[3 - i];
            part += `${digit === 1 && unit ? '' : digits[digit]}${unit}`;
        }
        if (part) result += `${part}${big[groups.length - 1 - index]}`;
    });
    return `${result}원정`;
};

const formatQuoteDate = (value) => {
    const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return value || '';
    return `${match[1]}년 ${Number(match[2])}월 ${Number(match[3])}일`;
};

const ITEM_LINE_COUNT = 23;

const buildQuoteHtml = ({ recipient, quoteDate, groups }) => {
    const finalAmount = groups.reduce((sum, group) => sum + group.net, 0);
    const totalQty = groups.reduce((sum, group) => sum + group.qty, 0);
    const supplyTotal = groups.reduce((sum, group) => sum + group.supply, 0);
    const split = groups.filter((group) => group.rate > 0).length > 1
        || (groups.length > 1 && groups.some((group) => group.rate > 0));
    const flatRows = groups.flatMap((group) => group.rows.map((row) => ({ ...row, rate: group.rate })));
    const blankCount = Math.max(0, ITEM_LINE_COUNT - flatRows.length);

    const itemRows = flatRows.map((row) => `
        <tr>
            <td class="name">${esc(row.name)}</td>
            <td>${esc(row.spec)}</td>
            <td>${won(row.qty)}</td>
            <td></td>
            <td>${won(row.supply)}</td>
            <td></td>
            <td>${split && row.rate > 0 ? `${row.rate}%` : ''}</td>
        </tr>
    `).join('');
    const blankRows = Array.from({ length: blankCount }, () => `
        <tr class="blank"><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
    `).join('');
    const discountCount = groups.filter((group) => group.rate > 0).length;
    const bodyRowCount = Math.max(ITEM_LINE_COUNT, flatRows.length) + 2 + discountCount;
    const rowMm = (190 / bodyRowCount).toFixed(2);
    const discountRows = groups.filter((group) => group.rate > 0).map((group) => `
        <tr class="discount">
            <td></td><td></td><td></td><td></td>
            <td>-${won(group.discount)}</td>
            <td></td>
            <td>${group.rate}%할인</td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>견적서</title>
<style>
    @page { size: A4; margin: 7mm 12mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #111; font-family: "Malgun Gothic", Dotum, sans-serif; font-size: 12px; }
    table { width: 100%; max-width: 100%; border-collapse: collapse; }
    .sheet { border: 2.5px solid #000; width: 100%; overflow: hidden; }
    .doc-head { position: relative; height: 18mm; margin-bottom: 0; border-bottom: 2.5px solid #000; }
    .no { position: absolute; left: 10px; top: 4mm; font-size: 13px; line-height: 1; }
    .no span { display: inline-block; width: 78px; height: 0; border-bottom: 1px solid #111; margin-left: 2px; vertical-align: baseline; position: relative; top: -1px; }
    .doc-title { text-align: center; font-size: 26px; font-weight: 700; letter-spacing: 12px; line-height: 1; padding-top: 4mm; }
    .dline { width: 168px; margin: 6px auto 0; border-top: 1px solid #111; border-bottom: 1px solid #111; height: 4px; }
    .head { margin-top: 0; table-layout: fixed; }
    .head td { border: 1px solid #111; height: 8mm; text-align: center; vertical-align: middle; padding: 0 4px; }
    .head tr:first-child td { border-top: none; }
    .head td.recv,
    .head td.vlabel,
    .head tr:last-child td { border-bottom: 2.5px solid #000; }
    .head td.recv { border-left: none; }
    .head td.vlabel { border-left: 2px solid #000; }
    .head tr td:last-child { border-right: none; }
    .head td.recv { padding: 10px 12px 12px; text-align: center; vertical-align: middle; font-size: 15px; }
    .recv .date { margin: 2px 0 18px; font-size: 15px; }
    .recv-line { display: inline-block; min-width: 150px; border-bottom: 1px solid #111; text-align: center; font-weight: 500; font-size: 15px; padding: 0 8px 2px; }
    .recv .hello { margin-top: 4px; font-size: 15px; }
    .recv .lead { margin-top: 18px; font-size: 15px; }
    .vlabel { padding: 6px 0; }
    .vchars { display: flex; flex-direction: column; justify-content: space-between; align-items: center; height: 46mm; line-height: 1; }
    .slabel { white-space: nowrap; padding: 0 2px; }
    .head td.val { text-align: left; padding-left: 8px; }
    .seal-row td { height: 16mm; }
    .name-cell { position: relative; padding: 0 4px; }
    .name-cell .nm { display: inline-block; }
    .seal { position: absolute; right: 10px; top: 50%; width: 11mm; height: 11mm; margin-top: -5.5mm; }
    .stamp {
        display: block; width: 11mm; height: 11mm;
        object-fit: contain; mix-blend-mode: multiply;
        -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .seal .in {
        position: absolute; left: 0; right: 0; top: 50%; margin-top: -5px;
        text-align: center; font-size: 10px; font-weight: 700; letter-spacing: 0;
    }
    .sum { margin-top: 0; }
    .sum td { border: none; border-bottom: 2.5px solid #000; height: 16mm; text-align: center; vertical-align: middle; }
    .sum-inner { display: flex; align-items: center; height: 100%; }
    .sum-label { flex: 0 0 auto; padding-left: 12px; text-align: left; font-size: 15px; font-weight: 700; letter-spacing: 4px; line-height: 1.3; }
    .sum-label span { display: block; margin-top: 2px; font-size: 15px; font-weight: 700; letter-spacing: 0; }
    .sum-amount { flex: 1; text-align: center; font-size: 16px; font-weight: 700; letter-spacing: 0.5px; }
    .grid { margin-top: 0; }
    .grid th, .grid td { border: 1px solid #111; text-align: center; font-weight: 400; }
    .grid th { height: 8mm; font-size: 12px; letter-spacing: 1px; border-top: none; }
    .grid th:first-child, .grid td:first-child { border-left: none; }
    .grid th:last-child, .grid td:last-child { border-right: none; }
    .grid tr:last-child td { border-bottom: none; }
    .grid tbody td { height: ${rowMm}mm; font-size: 12px; padding: 0 4px; text-align: center; }
    .grid td.name { text-align: center; padding-left: 4px; }
    .grid tr.total td { font-weight: 700; }
    .grid tr.discount td { font-weight: 700; }
</style>
</head>
<body>
    <div class="sheet">
    <div class="doc-head">
        <div class="no">No.<span></span></div>
        <div class="doc-title">견 적 서<div class="dline"></div></div>
    </div>
    <table class="head">
        <colgroup>
            <col style="width:40%">
            <col style="width:32px">
            <col style="width:108px">
            <col>
            <col style="width:58px">
            <col style="width:132px">
        </colgroup>
        <tr>
            <td class="recv" rowspan="5">
                <div class="date">${esc(formatQuoteDate(quoteDate))}</div>
                <div class="hello"><span class="recv-line">${esc(recipient || '')}</span> 귀하</div>
                <div class="lead">아래와 같이 견적합니다.</div>
            </td>
            <td class="vlabel" rowspan="5"><div class="vchars"><span>공</span><span>급</span><span>자</span></div></td>
            <td class="slabel">등 록 번 호</td>
            <td class="val" colspan="3">${SUPPLIER.regNo}</td>
        </tr>
        <tr class="seal-row">
            <td class="slabel">상 호</td>
            <td class="val">${SUPPLIER.company}</td>
            <td class="slabel">성 명</td>
            <td class="name-cell val">
                <span class="nm">${SUPPLIER.name}</span>
                <span class="seal">
                    <img class="stamp" src="${esc(new URL(stampImg, window.location.href).href)}" alt="">
                    <span class="in">(인)</span>
                </span>
            </td>
        </tr>
        <tr>
            <td class="slabel">사 업 장 주 소</td>
            <td class="val" colspan="3">${SUPPLIER.address}</td>
        </tr>
        <tr>
            <td class="slabel">업 태</td>
            <td class="val">${SUPPLIER.bizType}</td>
            <td class="slabel">종 목</td>
            <td class="val">${SUPPLIER.bizItem}</td>
        </tr>
        <tr>
            <td class="slabel">전 화 번 호</td>
            <td class="val" colspan="3">${SUPPLIER.phone} ${SUPPLIER.name}</td>
        </tr>
    </table>
    <table class="sum">
        <tr>
            <td>
                <div class="sum-inner">
                    <div class="sum-label">합 계 금 액<span>(공급가액+세액)</span></div>
                    <div class="sum-amount">${esc(koreanWon(finalAmount))} ( ₩ ${won(finalAmount)}원 )</div>
                </div>
            </td>
        </tr>
    </table>
    <table class="grid">
        <thead>
            <tr>
                <th style="width:22%">품 명</th>
                <th style="width:14%">규 격(cm)</th>
                <th style="width:8%">수 량</th>
                <th style="width:13%">단 가</th>
                <th style="width:16%">공 급 가 액</th>
                <th style="width:12%">세 액</th>
                <th style="width:15%">비 고</th>
            </tr>
        </thead>
        <tbody>
            ${itemRows}
            ${blankRows}
            <tr class="total">
                <td>계</td>
                <td></td>
                <td>${won(totalQty)}</td>
                <td></td>
                <td>${won(supplyTotal)}</td>
                <td></td>
                <td></td>
            </tr>
            ${discountRows}
            <tr class="total">
                <td>최종금액</td>
                <td></td>
                <td></td>
                <td></td>
                <td>${won(finalAmount)}</td>
                <td></td>
                <td>부가세포함</td>
            </tr>
        </tbody>
    </table>
    </div>
</body>
</html>`;
};

const OrderQuoteSheet = ({ open, orders, partialWarning, onClose }) => {
    const [recipient, setRecipient] = useState('');
    const [quoteDate, setQuoteDate] = useState('');
    const [rateByOid, setRateByOid] = useState({});

    useEffect(() => {
        if (!open) return;
        const nextRates = {};
        orders.forEach((order) => {
            nextRates[order.oid] = inferDiscountPercent(order.items);
        });
        setRateByOid(nextRates);
        const names = [...new Set(orders.map((order) => (order.ordererName || '').trim()).filter(Boolean))];
        setRecipient(names[0] || '');
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        setQuoteDate(`${today.getFullYear()}-${month}-${day}`);
    }, [open, orders]);

    const groups = useMemo(
        () => buildGroups(orders, rateByOid),
        [orders, rateByOid]
    );
    const finalAmount = groups.reduce((sum, group) => sum + group.net, 0);
    const names = [...new Set(orders.map((order) => (order.ordererName || '').trim()).filter(Boolean))];

    if (!open) return null;

    const handlePrint = () => {
        if (!recipient.trim()) {
            toast.error('수신자를 입력해 주세요.');
            return;
        }
        if (names.length > 1) {
            const ok = window.confirm(`주문자명이 서로 다릅니다. (${names.join(', ')})\n이대로 한 장에 출력할까요?`);
            if (!ok) return;
        }
        const printWindow = window.open('', '', 'width=900,height=1000');
        if (!printWindow) {
            toast.error('팝업이 차단되어 인쇄 창을 열 수 없습니다.');
            return;
        }
        printWindow.document.write(buildQuoteHtml({ recipient: recipient.trim(), quoteDate, groups }));
        printWindow.document.close();
        printWindow.focus();
        const stamp = printWindow.document.querySelector('.stamp');
        const doPrint = () => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        };
        if (!stamp || stamp.complete) {
            setTimeout(doPrint, 200);
        } else {
            stamp.onload = () => setTimeout(doPrint, 150);
            stamp.onerror = () => setTimeout(doPrint, 150);
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] bg-black/40 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg shadow-lg p-5"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                        <h3 className="text-lg font-bold">견적서</h3>
                        <p className="text-xs text-gray-500 mt-1">
                            할인율이 같으면 규격이 같은 줄을 합치고, 할인율이 다르면 할인 줄을 나눠 적습니다.
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-black text-lg">✕</button>
                </div>

                {partialWarning && (
                    <p className="mb-3 text-xs text-red-500">
                        상태나 카테고리 필터가 켜져 있습니다. 지금 목록에 있는 상품만 견적에 포함됩니다.
                    </p>
                )}
                {names.length > 1 && (
                    <p className="mb-3 text-xs text-amber-700">
                        선택한 주문의 주문자명이 다릅니다. 수신자를 확인한 뒤 출력해 주세요.
                    </p>
                )}

                <div className="flex flex-wrap gap-3 mb-4">
                    <label className="text-sm">
                        <span className="block text-xs text-gray-500 mb-1">수신</span>
                        <input
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            className="border px-2 py-1 w-40"
                        />
                    </label>
                    <label className="text-sm">
                        <span className="block text-xs text-gray-500 mb-1">견적일</span>
                        <input
                            type="date"
                            value={quoteDate}
                            onChange={(e) => setQuoteDate(e.target.value)}
                            className="border px-2 py-1"
                        />
                    </label>
                </div>

                <div className="space-y-2 mb-4">
                    {orders.map((order) => {
                        const rate = normalizeRate(rateByOid[order.oid]);
                        const rows = (order.items || []).map(toRow);
                        const supply = rows.reduce((sum, row) => sum + row.supply, 0);
                        const paid = (order.items || []).reduce(
                            (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
                            0
                        );
                        const discount = Math.round(supply * rate / 100);
                        return (
                            <div key={order.oid} className="border rounded p-3 text-sm flex flex-wrap items-center gap-x-4 gap-y-2">
                                <div className="min-w-[180px]">
                                    <div className="font-semibold">주문 {order.oid}</div>
                                    <div className="text-xs text-gray-500">
                                        {(order.createdAt || '').slice(0, 10)} · {order.ordererName || '-'}
                                    </div>
                                </div>
                                <div className="text-xs text-gray-600">
                                    정가 {won(supply)}원
                                    <span className="mx-1">/</span>
                                    결제 {won(paid)}원
                                </div>
                                <label className="flex items-center gap-1">
                                    <span className="text-xs text-gray-500">할인율</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={rateByOid[order.oid] ?? 0}
                                        onChange={(e) => setRateByOid((prev) => ({
                                            ...prev,
                                            [order.oid]: e.target.value,
                                        }))}
                                        className="border w-16 px-2 py-1 text-right"
                                    />
                                    <span>%</span>
                                </label>
                                <div className="ml-auto text-right">
                                    <div className="text-xs text-red-600">할인 -{won(discount)}원</div>
                                    <div className="font-semibold">{won(supply - discount)}원</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="border rounded overflow-hidden mb-4">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr className="text-center">
                                <th className="p-2 font-medium">구분</th>
                                <th className="p-2 font-medium">품명</th>
                                <th className="p-2 font-medium">규격</th>
                                <th className="p-2 font-medium">수량</th>
                                <th className="p-2 font-medium">단가</th>
                                <th className="p-2 font-medium">공급가액</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.flatMap((group) => {
                                const nodes = [];
                                if (groups.length > 1) {
                                    nodes.push(
                                        <tr key={`head-${group.rate}`} className="bg-gray-100">
                                            <td colSpan={6} className="px-2 py-1 font-semibold">
                                                {group.rate > 0 ? `할인 ${group.rate}%` : '할인 없음'}
                                                {' · '}
                                                주문 {group.oids.join(', ')}
                                            </td>
                                        </tr>
                                    );
                                }
                                group.rows.forEach((row, index) => {
                                    nodes.push(
                                        <tr key={`${group.rate}-${row.name}-${row.spec}-${row.unit}-${index}`} className="border-t text-center">
                                            <td className="px-2 py-1">{group.rate > 0 ? `${group.rate}%` : '-'}</td>
                                            <td className="px-2 py-1">{row.name}</td>
                                            <td className="px-2 py-1">{row.spec}</td>
                                            <td className="px-2 py-1">{won(row.qty)}</td>
                                            <td className="px-2 py-1">{won(row.unit)}</td>
                                            <td className="px-2 py-1">{won(row.supply)}</td>
                                        </tr>
                                    );
                                });
                                if (group.rate > 0) {
                                    nodes.push(
                                        <tr key={`discount-${group.rate}`} className="border-t text-red-600 font-semibold">
                                            <td colSpan={5} className="px-2 py-1 text-right">할인 {group.rate}%</td>
                                            <td className="px-2 py-1 text-center">-{won(group.discount)}</td>
                                        </tr>
                                    );
                                }
                                return nodes;
                            })}
                            <tr className="border-t bg-gray-50 font-bold">
                                <td colSpan={5} className="px-2 py-2 text-right">최종금액 (부가세포함)</td>
                                <td className="px-2 py-2 text-center">{won(finalAmount)}원</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-3 py-2 border rounded text-sm">닫기</button>
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="px-4 py-2 rounded bg-black text-white text-sm"
                    >
                        인쇄
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderQuoteSheet;
