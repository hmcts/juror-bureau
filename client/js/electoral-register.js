let allChecked = false;
let chkbxs = document.getElementsByName('selectedAuthorities');

if (chkbxs.length > 0) {
  document.getElementById("totalAuthorities").innerHTML = chkbxs.length || 0;
  document.getElementById("checkedAuthorities").innerHTML = 0;


  document.getElementById('selectAllCheckbox').addEventListener('change', selectAll);
  document.getElementsByName('selectedAuthorities').forEach((checkbox) => {
    checkbox.addEventListener('change', checkSet);
  });

  function selectAll() {
    if (allChecked) {
      allChecked = false;
      for(var i = 0; i < chkbxs.length; i++){
        if (chkbxs[i].type=='checkbox')
        chkbxs[i].checked = false;   
      }
      document.getElementById("checkedAuthorities").innerHTML = $('input:checkbox:checked').length;
    } else {
      allChecked = true;
      for(var i = 0; i < chkbxs.length; i++){
        if (chkbxs[i].type=='checkbox')
        chkbxs[i].checked = true;  
      }
      document.getElementById("checkedAuthorities").innerHTML = $('input:checkbox:checked').length - 1;
    }
  };

  function checkSet() {
    document.getElementById("checkedAuthorities").innerHTML = $('input:checkbox:checked').length;
    if (chkbxs.length > document.getElementsByName('selectedAuthorities:checked').length) {
      document.getElementsByName('selectAllCheckbox')[0].checked = false;
      allChecked = false;
    }
  }
}

$(document).ready(() => {
  $('[name="status"]').on('change', function() {
    var urlParams = new URLSearchParams(window.location.search);
    const localAuthorityFilter = urlParams.get('localAuthorityFilter') || '';

    window.location.href = '/electoral-register?status=' + $(this).val()
    + `${localAuthorityFilter ? `&localAuthorityFilter=${encodeURIComponent(localAuthorityFilter)}` : ''}`;
  });
});