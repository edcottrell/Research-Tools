/**
 * Research tools for online legal research
 * This script highlights concurring and dissenting opinions (including concurring in part and dissenting in part) in Westlaw.
 * It also turns Texas state court case numbers into clickable links to the TAMES search results.
 * 
 * This code is in beta. It is NOT LICENSED for any use except by express written permission of the author.
 * 
 * (c) 2014, 2015 Ed Cottrell
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
    starPageBG = '#0000ff',
    footnoteReferenceSize = '100%',
    footnoteReferenceBackgroundColor = '#ffdddd',
    footnoteReferenceBorderThickness = '1px',
    footnoteReferenceBorderType = 'solid',
    footnoteReferenceBorderColor = '#ffcccc',
    $courtBlock = $('.co_courtBlock'),
    $docketBlock = $('.co_docketBlock'),
    docketBlockHTML = $docketBlock.length? $docketBlock.html() : null;

/**
 * Create a form for handling Texas CCA "links"
 */
function initTexasCCAForm() {
    var txCCAForm,
        CaseNumberNo;
    if(!document.getElementsByName('txCCAForm').length) {
        txCCAForm = document.createElement('form');
        txCCAForm.name = 'txCCAForm';
        txCCAForm.action = 'http://www.cca.courts.state.tx.us/opinions/casesearch.asp';
        txCCAForm.target = '_blank';
        document.getElementsByTagName("body")[0].appendChild(txCCAForm);
        if(!document.getElementsByName('CaseNumberNo').length) {
            CaseNumberNo = document.createElement('input');
            CaseNumberNo.name = 'CaseNumberNo';
            document.getElementsByName("txCCAForm")[0].appendChild(CaseNumberNo);
        }
    }
}

/**
 * Handle Texas TAMES links
 */
function goToTexasTAMESLink(caseNo, isCCA) {
    var domain = "http://www.search.txcourts.gov/", /* Domain for the searches */
	    path = "CaseSearch.aspx?coa=cossup"; /* Initialize the URL to use if we cannot do a search */
    
    caseNo = realTexasCaseNumberFromString(caseNo);
    
    if(caseNo != "") {
        path = "Case.aspx?cn="+caseNo;
    }
    window.open(domain + path);
}

/**
 * Is it a Texas Court of Criminal Appeals case?
 */
function isTexasCCACase() {
    return $courtBlock && $courtBlock.text().match(/Court of Criminal Appeals of Texas/);
}

/**
 * Is it a Texas case in the Supreme Court of Texas or Courts of Appeals?
 */
function isTexasNonCCACase() {
    return $courtBlock && $courtBlock.text().match(/(?:Supreme Court|Court of (?:Civil )?Appeals) of Texas/);
}

/* Get the real Texas case number (no leading "No.", for example) from a string */
function realTexasCaseNumberFromString(caseNo) {
    var caseNoParts;
    
    /* Replace en-dashes with hyphens and strip any leading or trailing characters */
	caseNo = caseNo.replace(/\u2013/g, "-");

    /* If the case is a -CR or -CV case, make sure the numeric parts are appropriately padded with leading zeroes */
	if (caseNo.match(/C[RV]$/)) {
		caseNoParts = caseNo.split("-");
		caseNoParts[0] = ("00"+caseNoParts[0]).slice(-2);
		caseNoParts[1] = ("00"+caseNoParts[1]).slice(-2);
		caseNoParts[2] = ("00000"+caseNoParts[2]).slice(-5);
		caseNo = caseNoParts.join("-");
	}
    return caseNo;
}


$(function() { /* Don't run until jQuery is loaded */
    /* See if it's a Texas case */
    if (docketBlockHTML && (isTexasCCACase() || isTexasNonCCACase())) {
        $docketBlock.html(docketBlockHTML.replace(/((?:<[^>]+>|Nos?\.\s*|,\s*)+)([^,.]+)/g, '$1<span class="researchToolsTexasTAMESLink">$2</span>'));
        $('.researchToolsTexasTAMESLink')
            .css({color:'blue', 'text-decoration' : 'underline', 'cursor': 'pointer'})
            .on('click', function() {
                goToTexasTAMESLink($(this).text(), isTexasCCACase());
            });
        if (isTexasCCACase()) {
            initTexasCCAForm();
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
         '    .co_footnoteReference {',
         '        font-size: ' + footnoteReferenceSize + ';',
         '        background-color: ' + footnoteReferenceBackgroundColor + ';',
         '        border: ' + footnoteReferenceBorderThickness + ' ' + footnoteReferenceBorderType + ' ' + footnoteReferenceBorderColor + ';',
         '    }',
         '    .co_docketBlock span.researchToolsTexasTAMESLink {',
         '        padding-right: 0px;',
         '        margin-right: 0px;',
         '        border-right: none;',
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
    
    
    /**
     * Jump to a star page if the user presses / or * anywhere but a search box
     */
    $('body').on('keypress', function(e) {
        var tag = e.target.tagName.toLowerCase(),
            page,
            $page,
            $doc = $('#co_document_0'),
            docTop = $doc.length ? $doc.offset().top : 0;
            
        if (tag != 'textarea' && tag != 'input') {
            if (e.keyCode === 42 && $doc.length) { // *
                e.preventDefault();
                e.stopPropagation();
                page = parseInt(prompt('Enter the page to go to:'));
                $page = $('.co_starPage:contains("' + page + '")');
                if ($page.length) {
                    $('body').animate({ scrollTop: $page.offset().top - docTop  }, 500);
                }
            } else if (e.keyCode === 47) { // /
                e.preventDefault();
                e.stopPropagation();
                $('#searchInputId').focus();
            }
        }
	});
});
