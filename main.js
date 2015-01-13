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
    concurBG = '#fffff3',
    starPageSize = '150%',
    starPageColor = '#ffffff',
    starPageBG = '#0000ff';

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
        /* It is (either COA or SCTEX), so make the case number clickable */
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
    else if( cblock && cblock.text().match(/Court of Criminal Appeals of Texas/) ) {
	/* It's a Texas CCA case; set up a form to submit the search */
	var caseNoBlock = $('.co_docketBlock');
	if(caseNoBlock) {
		if(!document.getElementsByName('txCCAForm').length) {
			var txCCAForm = document.createElement('form');
			txCCAForm.name = 'txCCAForm';
			txCCAForm.action = 'http://www.cca.courts.state.tx.us/opinions/casesearch.asp';
			txCCAForm.target = '_blank';
			document.getElementsByTagName("body")[0].appendChild(txCCAForm);
			if(!document.getElementsByName('CaseNumberNo').length) {
				var CaseNumberNo = document.createElement('input');
				CaseNumberNo.name = 'CaseNumberNo';
				document.getElementsByName("txCCAForm")[0].appendChild(CaseNumberNo);
			}
		}
		var caseNo = RealCaseNumberFromString(caseNoBlock.text());
		/* If the case number is non-empty, get the URL for the search page. */
		if(caseNo != "") {
			caseNoBlock
				.css({color:'blue', 'text-decoration' : 'underline', 'cursor': 'pointer'})
				.on('click', function() {
					document.getElementsByName("CaseNumberNo")[0].value = caseNo;
					document.getElementsByName("txCCAForm")[0].submit();
				});
		}
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
    
    /* Make star pages easier to find */
    $('.co_starPage').css(
    	{
    		fontSize: starPageSize,
    		color: starPageColor,
    		backgroundColor: starPageBG
    	}
    );
    /* Make star pages easier to find and Preserve star page formatting even when the page is part of highlighted text */
    $('body').append(
        ['<style>',
         '    .co_document .co_starPage {',
         '        font-size: ' + starPageSize + ';',
         '        color: ' + starPageColor + ';',
         '        background-color: ' + starPageBG + ';',
         '    }',
         '    .co_starPage .co_hl {',
         '        color: ' + starPageColor + ';',
         '        background-color: ' + starPageBG + ' !important;',
         '    }',
         '</style>'].join("\n")
    );
    
    /**
     * Fix spacing and formatting issues, particularly in citations
     * Fixes include:
     *   - no space after multi-character text (e.g., "Tex.2012")
     *   - hyphen instead of em dash in "Tex. App.-[city]"
     *   - smart single quotes
     */
    $('.co_contentBlock *') // only look in the opinion, not elsewhere on the page
        .not('html,body,head,script,img,iframe,style,.co_contentBlock,.x_opinionBody') // limit to smaller elements, not big, organizational elements
        .not('[href],[src]') // exclude anything with an href or src property; they will result in false matches
        .each(
            function() {
                var $html = jQuery(this).html();
                if ($html.match(/'|([a-z]{2,}\.)(?!$|\s|[\)\]\u2014-])(?=[^>]*?(?:<|$))|Tex\.\s*App\./gi)) { //limit to elements with text we care about
                    $(this)
                        .html(
                            $html
                                .replace(/([a-z]{2,}\.)(?!$|\s|[\)\]\u2014,-])(?=[^>]*?(?:<|$))/gi, '$1 ') // fix, for example, Tex.App., Civ.P., Tex.2012, etc.
                                .replace(/Tex\. App\.-/g, 'Tex. App.&#8212;') // fix em dashes in Tex. App. ....
                                .replace(/([^\s])'/g, '$1&#8217;') // fix apostrophes
                                .replace(/(^|\s)'/g, '$1&#8216;') // fix opening single quotes
                        )
                }
            }
        );
});
