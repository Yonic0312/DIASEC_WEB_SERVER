import React from 'react';

const BankTransfer = ({ 
    bankAccount, 
    setBankAccount,
    depositor,
    setDepositor,
    // receiptType, 
    // setReceiptType,
    // receiptMethod,
    // setReceiptMethod,
    // receiptInfo,
    // setReceiptInfo
 }) => {
    void bankAccount;
    void setBankAccount;
    void depositor;
    void setDepositor;
    
    return (
        // <div className="mt-6">
        //     <div className="w-full mb-5 px-2">
        //         <div className="flex font-bold mt-3 mb-3">현금영수증</div>
        //         <div className="
        //             flex gap-2 md:text-base text-[clamp(12px,2.085vw,16px)]">
        //             {["개인(소득공제용)", "사업자(지출증빙용)"].map((type) => (
        //                 <button key={type} 
        //                         onClick={() => {
        //                                 setReceiptType(type);
        //                                 setReceiptInfo("");
        //                             }
        //                         }
        //                         className={`border-[1px] w-1/2 py-2 ${receiptType === type ? 'bg-black text-white' : 'bg-white text-black'}`}> 
        //                     {type} 
        //                 </button>
        //             ))}
        //         </div>
        //     </div>

        //     {receiptType === "개인(소득공제용)" && (
        //         <div className="
        //             flex mt-3 ml-2 gap-2
        //             md:text-base text-[clamp(11px,2.085vw,16px)]">
        //             <select 
        //                 value={receiptMethod} 
        //                 onChange={(e) => {
        //                     setReceiptMethod(e.target.value)
        //                     setReceiptInfo("");
        //                 }}
        //                 className="min-w-[130px] border-[1px] h-8">
        //                 <option>휴대폰번호</option>
        //                 <option>현금영수증카드</option>
        //             </select>
        //             <input 
        //                 type="text" 
        //                 value={receiptInfo}
        //                 onChange={(e) => {
        //                     const onlyNumber = e.target.value.replace(/\D/g, '');
        //                     setReceiptInfo(onlyNumber);
        //                 }}
        //                 placeholder="숫자만 입력"
        //                 inputMode="numeric"
        //                 className="border-[1px] h-8 pl-2 md:w-[200px] w-full mr-2"
        //             />
        //         </div>
        //     )}

        //     {receiptType === "사업자(지출증빙용)" && (
        //         <div className="mt-3
        //             md:text-base text-[clamp(11px,2.085vw,16px)]">
        //             <input 
        //                 type="text" 
        //                 value={receiptInfo} 
        //                 onChange={(e) => {
        //                     const onlyNumber = e.target.value.replace(/\D/g, '');
        //                     setReceiptInfo(onlyNumber);
        //                 }}
        //                 placeholder="사업자등록번호 입력" 
        //                 className="border-[1px] h-8 ml-2 pl-2 w-[200px]" 
        //             />
        //         </div>
        //     )}

        //     <hr />
        // </div>
        <></>
    );
};

export default BankTransfer;