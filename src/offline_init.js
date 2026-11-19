var OH0=location.hash;
// offline_init.js: open saved data on start, and keep the Forecast tab current when the account changes.
setTimeout(async()=>{const _dA=drawAll;drawAll=function(){_dA();try{if($("tabP")&&$("tabP").style.display!=="none")drawFc()}catch(e){}};
 const acc=await loadAcc();const ok=await loadProject();if(ok){checkData();if(OCHK.ok){applyData();OMSG="Opened your saved data."}}if(!(ok&&OCHK.ok)&&acc)accApply();setDataChip();
 if(!ok&&!OH0)tab("data");else if(OH0==="#data")tab("data");else if(OH0==="#forecast")tab("forecast");OFF_READY=true},0);
