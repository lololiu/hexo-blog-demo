function changeNavActive (code) {
  $(".nav li").removeClass("active");//this will remove the active class from  
  if(code==0){
  $('#Blog').addClass('active');
  }else if(code==1){
  $('#随笔').addClass('active');
  }else if(code==2){
  $('#About').addClass('active');
  }
};