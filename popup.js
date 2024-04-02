let histCnt=[0,0];
document.addEventListener('DOMContentLoaded', init);

function getUrl(tab) {
	return (tab.url == "" && !!tab.pendingUrl && typeof tab.pendingUrl !== 'undefined' && tab.pendingUrl != '') ? tab.pendingUrl : tab.url;
}

var txtArea = document.getElementById('urls');
var lazyLoadCheckbox = document.getElementById('lazyLoad');
var addHistCheckbox = document.getElementById('addHist');
lazyLoadCheckbox.checked=true;

var tbsd=[];

function init () {
  // add event listener for buttons
  document.getElementById('open').addEventListener('click', loadSites);
  document.getElementById('extract').addEventListener('click', extractURLs);

  // select text in form field
  txtArea.select()
}

async function tabs_discard(d){
	return new Promise(function(resolve) {
				chrome.tabs.discard(d, function(tab){
						resolve();
				});
	});
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if(changeInfo.url){
		let ix=tbsd.findIndex((t)=>{return t===tabId;}); if(ix>=0){
			(async ()=>{ await tabs_discard(tabId); })();
			tbsd=tbsd.filter((t)=>{return t!==tabId;});
		}
	}
});

chrome.tabs.onCreated.addListener((tab)=>{
				let du=getUrl(tab);
				let vu=(!!du && typeof du!=="undefined" && du!=="")?true:false;
				let ix=tbsd.findIndex((t)=>{return t===tab.id;}); 
				
			if( vu &&  ix>=0 && !du.startsWith('about:')){
					(async ()=>{ await tabs_discard(tab.id); })();
					tbsd=tbsd.filter((t)=>{return t!==tab.id;});
			}
			
});


// load sites in new background tabs
function loadSites (e) {

	  var urls = txtArea.value.split(/\r\n?|\n/g);
	  var lazyloading = lazyLoadCheckbox.checked;
	  var addhist = addHistCheckbox.checked;
	  if(addhist){
			histCnt=[0,urls.length];
	  }
	 for (var i =0, len=urls.length; i<len; i++) {
		theurl = urls[i].trim();

		if(addhist){
			chrome.history.addUrl({
				url: theurl
			},()=>{
				histCnt[0]+=1;
				if(histCnt[0]===histCnt[1]){
					alert('All URLs added to history!');
				}
			});
		}else{
			if (
					lazyloading &&
					theurl.split(':')[0] != 'view-source' &&
					theurl.split(':')[0] != 'file'
			) {
			chrome.tabs.create({
				"url": theurl,
				"selected": false,
				"active": false
			}, function(tab) {
				tbsd.push(tab.id);
			});
			}else {
				chrome.tabs.create({ url: theurl, selected: false })
			}
		}


	}

}

// extract urls from text
function extractURLs (e) {
	var text = txtArea.value;

	var urls = '';
	const urlregex =/\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()[\]{};:'".,<>?«»“”‘’]))/gi;
	urls=text.match(urlregex).join('\n');

	txtArea.value = urls;
}
