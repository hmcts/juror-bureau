const tabID = Math.random().toString(36).substring(5);
const tabChannel = new BroadcastChannel('tab-channel');
tabChannel.postMessage({ source: tabID });

tabChannel.onmessage = function(e) {
  if (e.data.source !== tabID) { 
    $('#multiple-tabs').show();
    if (!e.data.isResponse) {
      tabChannel.postMessage({ source: tabID, isResponse: true });
    }
  }
};

$('#refreshLink').click(() => window.location.reload());
setTimeout(() => {
  if ($('#multiple-tabs').is(':visible')) {
    fetch('/multiple-tabs?action=opened');
  } else {
    fetch('/multiple-tabs?action=closed');
  }
}, 2000);