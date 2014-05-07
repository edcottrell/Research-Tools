/**
 * Research tools for online legal research
 * This script highlights concurring and dissenting opinions (including concurring in part and dissenting in part) in Westlaw.
 * It also turns Texas state court case numbers into clickable links to the TAMES search results.
 * 
 * This code is in beta. It is NOT LICENSED for any use except by express written permission of the author.
 * 
 * (c) 2014 Ed Cottrell
 */

/* A couple of global variables */
var dissentBorder = '4px solid #ff3333',
    concurBorder = '4px solid #ffff33',
    dissentPadding = '4px',
    concurPadding = '4px',
    dissentBG = '#fff3f3',
    concurBG = '#fffff3';

/* Get the real Texas case number (no leading "No.", for example) from a string */
function RealCaseNumberFromString(caseNo) {
    /* Replace en-dashes with hyphens and strip any leading or trailing characters */
	caseNo = caseNo.replace(/\u2013/g, "-").replace(/^[^\d]+|[^CRV\d]+$/g, "");

    /* If the case is a -CR or -CV case, make sure the numeric parts are appropriately padded with leading zeroes */
	if(caseNo.match(/C[RV]$/)) {
		var caseNoParts = caseNo.split("-");
		caseNoParts[0] = ("00"+caseNoParts[0]).slice(-2);
		caseNoParts[1] = ("00"+caseNoParts[1]).slice(-2);
		caseNoParts[2] = ("00000"+caseNoParts[2]).slice(-5);
		caseNo = caseNoParts.join("-");
	}
    return caseNo;
}


$(function() { /* Don't run until jQuery is loaded */
    /* See if it's a Texas case */
    var cblock = $('.co_courtBlock');
    if( cblock && cblock.text().match(/(?:Supreme Court|Court of (?:Civil )?Appeals) of Texas/) ) {
        /* It is, so make the case number clickable */
        var domain = "http://www.search.txcourts.gov/", /* Domain for the searches */
		    path = "CaseSearch.aspx?coa=cossup"; /* Initialize the URL to use if we cannot do a search */
            caseNoBlock = $('.co_docketBlock');
        if(caseNoBlock) {
            var caseNo = RealCaseNumberFromString(caseNoBlock.text());
            /* If the case number is non-empty, get the URL for the search page. */
            if(caseNo != "") {
                path = "Case.aspx?cn="+caseNo;
            }
            caseNoBlock
                .css({color:'blue', 'text-decoration' : 'underline', 'cursor': 'pointer'})
                .on('click', function() {
                    window.open(domain+path);
                });
        }
    }
    
    /* Highlight concurrences and dissents */
    $('.x_opinionDissent').css({
        'border': dissentBorder,
        'padding': dissentPadding,
        'background-color': dissentBG});
    $('.x_opinionCipdip,.x_opinionConcurrance').css({
        'border': concurBorder,
        'padding': concurPadding,
        'background-color': concurBG});
});
