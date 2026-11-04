/* Recountix Invoice Module
 * Extracted from the current index.html implementation.
 *
 * Required page integrations/globals:
 * - cfg, bills, billObj(), cash(), shareWhatsApp(), window.jspdf.jsPDF
 * - pdfSafe() is included below.
 * - nonGstTotals(), amountInWordsIndian(), formatDateDMY() are included below.
 * - Uses browser DOM/File/URL/Blob APIs.
 *
 * Load jsPDF before this module. It is a browser script, not a Node module.
 */

async function printBill(){const b=billObj();if(!b.cust){alert('Enter customer name first.');return}try{const blob=await makeInvoicePdfBlob(b);if(!blob||blob.size<1000)throw new Error('PDF could not be generated.');const url=URL.createObjectURL(blob),w=window.open(url,'_blank');if(!w){const a=document.createElement('a');a.href=url;a.download='Invoice-'+(b.no||'bill')+'.pdf';a.click()}setTimeout(()=>URL.revokeObjectURL(url),120000)}catch(e){alert('Could not prepare invoice: '+(e.message||e))}}
function pdfSafe(v){return String(v??'').replace(/[₹]/g,'Rs. ').replace(/[–—]/g,'-').replace(/[•]/g,'|').replace(/[^\x20-\x7E]/g,'?')}
async function makeInvoicePdfBlob(b){
 const JsPDF=window.jspdf&&window.jspdf.jsPDF;
 if(!JsPDF)throw new Error('PDF library did not load. Check internet and refresh.');
 const doc=new JsPDF({orientation:'portrait',unit:'mm',format:'a4'});
 const pageW=210,left=12,right=198,width=186,bottom=283;
 const subtotal=(b.items||[]).reduce((sum,it)=>sum+(Number(it.qty)||0)*(Number(it.rate)||0),0);
 const pct=Number.isFinite(Number(b.discountPercent))?Number(b.discountPercent):(subtotal>0?(Number(b.discount)||0)/subtotal*100:0);
 const totals=nonGstTotals(subtotal,pct,b.received);
 const navy=[5,35,83],blue=[0,158,221],pale=[210,239,252],ink=[12,32,70],lineColor=[112,148,179];
 let y=9;
 const safe=v=>pdfSafe(v==null?'':v);
 const text=(v,x,yy,size=8,opts={})=>{doc.setFontSize(size);doc.text(safe(v),x,yy,opts)};
 const fill=(x,yy,w,h,c)=>{doc.setFillColor(...c);doc.rect(x,yy,w,h,'F')};
 const stroke=(x,yy,w,h,c=lineColor)=>{doc.setDrawColor(...c);doc.setLineWidth(.25);doc.rect(x,yy,w,h,'S')};
 const line=(x1,y1,x2,y2,c=ink,th=.35)=>{doc.setDrawColor(...c);doc.setLineWidth(th);doc.line(x1,y1,x2,y2)};
 const roundFill=(x,yy,w,h,r,c)=>{doc.setFillColor(...c);doc.roundedRect(x,yy,w,h,r,r,'F')};
 const brand=String(cfg.shop||'Krishna Computer').trim()||'Krishna Computer';
 const initials=brand.split(/\s+/).filter(Boolean).slice(0,2).map(v=>v[0]).join('').toUpperCase()||'KC';
 let logoData=null,logoType='PNG';
 if(cfg.shopLogo){
  try{logoData=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{try{const cv=document.createElement('canvas'),iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height;if(!iw||!ih)throw new Error('Logo dimensions unavailable');const sc=Math.min(1,700/Math.max(iw,ih));cv.width=Math.max(1,Math.round(iw*sc));cv.height=Math.max(1,Math.round(ih*sc));const cx=cv.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,cv.width,cv.height);cx.drawImage(im,0,0,cv.width,cv.height);resolve(cv.toDataURL('image/jpeg',.9))}catch(e){reject(e)}};im.onerror=()=>reject(new Error('Logo could not load'));im.src=cfg.shopLogo}) ;logoType='JPEG'}catch(e){console.warn('Invoice logo could not be embedded:',e)}
 }
 function drawHeader(){
  // Compact white header; business address and email sit directly below shop name.
  doc.setFillColor(255,255,255);doc.rect(left,y,width,27,'F');
  doc.setTextColor(...navy);doc.setFont('helvetica','bold');doc.setFontSize(13);
  const shopLines=doc.splitTextToSize(safe(brand),130);doc.text(shopLines.slice(0,1),left+1,y+5.5);
  doc.setTextColor(...ink);doc.setFont('helvetica','normal');doc.setFontSize(7.1);
  const addr=String(cfg.shopAddress||'').trim();
  if(addr)doc.text(doc.splitTextToSize(safe(addr),130).slice(0,1),left+1,y+11.5);
  if(cfg.shopEmail)doc.text(doc.splitTextToSize(safe(cfg.shopEmail),130).slice(0,1),left+1,y+17.5);
  if(cfg.shopPhone)doc.text('Phone: '+safe(cfg.shopPhone),left+1,y+23);
  if(logoData){try{doc.addImage(logoData,logoType,right-37,y+1,35,23)}catch(e){doc.setTextColor(...blue);doc.setFont('helvetica','bold');doc.setFontSize(12);doc.text(initials,right-18,y+14,{align:'center'})}}
  else{doc.setTextColor(...blue);doc.setFont('helvetica','bold');doc.setFontSize(12);doc.text(initials,right-18,y+14,{align:'center'})}
  doc.setTextColor(...navy);doc.setFont('helvetica','bold');doc.setFontSize(19);
  doc.text('INVOICE',left+1,y+31);
  y+=34;
 }
 function pageHeader(){y=9;drawHeader();doc.setTextColor(...ink)}
 function ensure(h){if(y+h>bottom){doc.addPage();pageHeader();return true}return false}
 pageHeader();
 // Invoice/customer block: two fixed-width columns with wrapped values and aligned labels.
 const metaY=y;
 const customerLabelX=left+1,customerValueX=left+25,customerValueW=78;
 const invoiceColX=left+105,invoiceLabelX=invoiceColX+2,invoiceValueX=invoiceColX+32,invoiceValueW=right-invoiceValueX-2;
 doc.setFont('helvetica','bold');doc.setTextColor(...blue);doc.setFontSize(8.3);
 text('Customer:',customerLabelX,metaY+5,8.3);
 doc.setTextColor(...ink);doc.setFont('helvetica','bold');doc.setFontSize(8.2);
 const customerLines=doc.splitTextToSize(safe(b.cust||'Customer'),customerValueW);
 doc.text(customerLines,customerValueX,metaY+5,{lineHeightFactor:1.05});
 const nameH=Math.max(6,customerLines.length*4.2);
 doc.setFont('helvetica','bold');doc.setFontSize(7.4);text('Address:',customerLabelX,metaY+nameH+5,7.4);
 doc.setFont('helvetica','normal');doc.setFontSize(7.2);
 const addressLines=doc.splitTextToSize(safe(b.address||'-'),customerValueW);
 doc.text(addressLines,customerValueX,metaY+nameH+5,{lineHeightFactor:1.05});
 const addressH=Math.max(5.5,addressLines.length*3.8);
 const mobileY=metaY+nameH+addressH+5;
 doc.setFont('helvetica','bold');text('Mobile:',customerLabelX,mobileY,7.4);
 doc.setFont('helvetica','normal');text(b.phone||'-',customerValueX,mobileY,7.4);
 // Invoice number/date labels and values have separate columns; long values wrap within page.
 doc.setFont('helvetica','bold');doc.setFontSize(7.8);doc.setTextColor(...ink);
 text('Invoice No.:',invoiceLabelX,metaY+6,7.8);
 doc.setFont('helvetica','normal');doc.setFontSize(8);
 const invoiceNoLines=doc.splitTextToSize(safe(b.no||'-'),invoiceValueW);
 doc.text(invoiceNoLines,invoiceValueX,metaY+6,{lineHeightFactor:1.05});
 const invNoH=Math.max(6,invoiceNoLines.length*4.1);
 doc.setFont('helvetica','bold');doc.setFontSize(7.8);
 text('Invoice Date:',invoiceLabelX,metaY+invNoH+9,7.8);
 doc.setFont('helvetica','normal');doc.setFontSize(8);
 const invoiceDateLines=doc.splitTextToSize(safe(formatDateDMY(b.date)||'-'),invoiceValueW);
 doc.text(invoiceDateLines,invoiceValueX,metaY+invNoH+9,{lineHeightFactor:1.05});
 const invoiceBlockH=invNoH+Math.max(7,invoiceDateLines.length*4.1)+9;
 const customerBlockH=nameH+addressH+10;
 y+=Math.max(customerBlockH,invoiceBlockH,25)+3;
 // Simplified five-column item grid. Serial/IMEI details stay beneath product description.
 const cols=[10,91,20,28,37],headers=['Sr. No.','Description of Goods','Quantity','Rate (Rs.)','Amount (Rs.)'];
 function drawTableHeader(){
  fill(left,y,width,10,blue);let x=left;
  doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(7.5);
  cols.forEach((cw,i)=>{doc.text(headers[i],x+cw/2,y+6.5,{align:'center'});if(i>0)line(x,y,x,y+10,[255,255,255],.25);x+=cw});
  y+=10;
 }
 drawTableHeader();
 (b.items||[]).forEach((it,index)=>{
  const desc=String(it.desc||'-');
  const serial=String(it.serial||'').trim();
  const descLines=doc.splitTextToSize(safe(desc),cols[1]-4);
  const serialLines=serial?doc.splitTextToSize(safe(serial.replace(/[;,]\s*/g,', ')),cols[1]-8):[];
  const rowH=Math.max(12,descLines.length*3.5+serialLines.length*2.8+3.5);
  if(ensure(rowH))drawTableHeader();
  const bg=index%2===0?[255,255,255]:pale;fill(left,y,width,rowH,bg);
  let x=left;cols.forEach(cw=>{stroke(x,y,cw,rowH);x+=cw});
  doc.setTextColor(...ink);doc.setFont('helvetica','bold');doc.setFontSize(7.8);doc.text(String(index+1),left+cols[0]/2,y+rowH/2+1.2,{align:'center'});
  const dx=left+cols[0]+2.5;doc.setFont('helvetica','bold');doc.setFontSize(7.7);doc.text(descLines,dx,y+4,{lineHeightFactor:1.0});
  if(serialLines.length){doc.setFont('helvetica','normal');doc.setFontSize(6.6);doc.text(serialLines,dx+1.5,y+4+descLines.length*3.5,{lineHeightFactor:1.0})}
  const qx=left+cols[0]+cols[1],rateX=qx+cols[2],amountX=rateX+cols[3];
  doc.setFont('helvetica','bold');doc.setFontSize(8.5);text((Number(it.qty)||0)+' pc',qx+cols[2]/2,y+rowH/2+1.2,7.8,{align:'center'});
  doc.setFont('helvetica','normal');text((Number(it.rate)||0).toFixed(2),rateX+cols[3]/2,y+rowH/2+1.5,8.5,{align:'center'});
  doc.setFont('helvetica','bold');text(((Number(it.qty)||0)*(Number(it.rate)||0)).toFixed(2),amountX+cols[4]-2,y+rowH/2+1.2,7.8,{align:'right'});
  y+=rowH;
 });
 y+=6;
 // Payment block and tax/discount summary.
 ensure(44);
 const mid=left+102,totX=mid+5,totW=right-totX;
 line(mid,y,mid,y+38,blue,.7);
 roundFill(left,y,68,8,0,pale);doc.setTextColor(...navy);doc.setFont('helvetica','bold');text('Payment Details',left+3,y+5.5,9);
 doc.setTextColor(...ink);doc.setFont('helvetica','normal');
 line(left+3,y+15,left+96,y+15);line(left+3,y+23,left+96,y+23);line(left+3,y+31,left+96,y+31);
 const sumRows=[['Subtotal',totals.subtotal],['Discount',totals.discount],['CGST',0],['SGST',0]];
 doc.setFont('helvetica','bold');doc.setFontSize(8.5);
 sumRows.forEach((r,i)=>{fill(totX+39,y+i*7,totW-39,6.2,pale);doc.setTextColor(...ink);text(r[0]+':',totX,y+i*7+4.7,8.5);text((Number(r[1])||0).toFixed(2),right-2,y+i*7+4.7,8.5,{align:'right'})});
 roundFill(totX-2,y+29,totW+2,8,1,blue);doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');text('Grand Total (Rs.):',totX+1,y+34.5,9);text((Number(totals.total)||0).toFixed(2),right-2,y+34.5,9,{align:'right'});
 y+=44;
 // Amount in words, terms, and signatory footer.
 const words=String(b.words||amountInWordsIndian(totals.total)||'');
 if(words){ensure(15);roundFill(left,y,width,8,1,pale);doc.setTextColor(...navy);doc.setFont('helvetica','bold');text('Amount in words:',left+3,y+5.5,7.5);doc.setFont('helvetica','normal');text(words,left+35,y+5.5,7.2);y+=11}
 ensure(35);
 roundFill(left,y,74,8,0,pale);doc.setTextColor(...navy);doc.setFont('helvetica','bold');text('Terms & Conditions:',left+3,y+5.5,8.5);
 const terms=doc.splitTextToSize(safe(b.terms||cfg.defaultTerms||''),98);
 doc.setTextColor(...ink);doc.setFont('helvetica','normal');doc.setFontSize(7.3);if(terms.length)doc.text(terms,left+3,y+13,{lineHeightFactor:1.15});
 const sigX=right-67;line(sigX,y+26,right,y+26,navy,.4);doc.setTextColor(...navy);doc.setFont('helvetica','bold');text('Authorized Signatory',right-33.5,y+32,8.5,{align:'center'});
 // Blue lower ribbon accent.
 fill(left,bottom-4,width,4,navy);fill(left,bottom-4,55,2.2,blue);
 return doc.output('blob');
}
async function shareBillWhatsApp(id){
 const b=bills.find(x=>x.id===id);if(!b)return;
 if(!b.phone){alert('Customer mobile number is missing.');return}
 try{
  const blob=await makeInvoicePdfBlob(b);
  if(!blob||blob.size<1000)throw new Error('PDF could not be generated.');
  const file=new File([blob],'Invoice-'+(b.no||'bill')+'.pdf',{type:'application/pdf'});
  if(navigator.canShare&&navigator.canShare({files:[file]})&&navigator.share){await navigator.share({files:[file],title:'Invoice '+(b.no||''),text:'Invoice from '+(cfg.shop||'our shop')});return}
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  shareWhatsApp(b.phone,'Hello '+(b.cust||'Customer')+', your invoice '+(b.no||'')+' is ready. Please attach the downloaded PDF in this WhatsApp chat.');
  alert('PDF downloaded. Attach it in WhatsApp to send.');
 }catch(e){if(e.name!=='AbortError')alert('Could not create/share PDF: '+(e.message||e))}
}


/* Non-GST billing with percentage discount and FY in settings */
function nonGstTotals(subtotal,percent,received){
 const p=Math.min(100,Math.max(0,Number(percent)||0));
 const discount=Math.round(subtotal*p)/100;
 const total=Math.max(0,Math.round((subtotal-discount)*100)/100);
 const paid=Math.max(0,Number(received)||0);
 return {subtotal,discountPercent:p,discount,total,received:paid,balance:Math.max(0,Math.round((total-paid)*100)/100),taxMode:'none',gst:0,rate:0};
}
function amountInWordsIndian(value){
 const n=Math.round((Number(value)||0)*100)/100;
 const ones=['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
 const tens=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
 function underThousand(x){
  x=Math.floor(x);let out=[];
  if(x>=100){out.push(ones[Math.floor(x/100)]+' Hundred');x%=100}
  if(x>=20){out.push(tens[Math.floor(x/10)]+(x%10?' '+ones[x%10]:''))}
  else if(x>0)out.push(ones[x]);
  return out.join(' ');
 }
 function integerWords(x){
  x=Math.floor(x);if(!x)return 'Zero';
  const parts=[];
  const crore=Math.floor(x/10000000);x%=10000000;
  const lakh=Math.floor(x/100000);x%=100000;
  const thousand=Math.floor(x/1000);x%=1000;
  if(crore)parts.push(underThousand(crore)+' Crore');
  if(lakh)parts.push(underThousand(lakh)+' Lakh');
  if(thousand)parts.push(underThousand(thousand)+' Thousand');
  if(x)parts.push(underThousand(x));
  return parts.join(' ');
 }
 const rupees=Math.floor(n),paise=Math.round((n-rupees)*100);
 return 'Rupees '+integerWords(rupees)+(paise?' and '+underThousand(paise)+' Paise':'')+' Only';
}

function formatDateDMY(value){
 if(!value)return '—';
 const p=String(value).split('-');
 return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:value;
}
