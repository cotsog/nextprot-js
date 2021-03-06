$(function () {

    var loadOverview = function (overview, nxEntryName) {

        if ($("#nx-overview").length > 0) {
            Handlebars.registerHelper('link_to', function (type, options) {
                switch (type) {
                    case "term":
                        var url = "http://www.nextprot.org/db/term/" + this.accession;
                        return "<a target='_blank' href='" + url + "'>" + this.name + "</a>";
                    case "EC" :
                        var url = "http://www.nextprot.org/db/term/" + this;
                        return "<a target='_blank' href='" + url + "'> EC " + this + " </a>";
                    case "history":
                        var url = "http://www.uniprot.org/uniprot/" + this.slice(3) + "?version=*";
                        return "<a target='_blank' href='" + url + "'>Complete UniProtKB history</a>";
                }
            });

            var EC = [];
            var short = [];

            if (overview.recommendedProteinName.synonyms) {
                overview.recommendedProteinName.synonyms.forEach(function (p) {
                    if (p.qualifier === "EC") EC.push(p.name);
                    if (p.qualifier === "short") short.push(p.name);
                });
            }

            var data = {
                "entryName": overview.proteinNames[0].synonymName,
                "recommendedProteinName": {
                    name: overview.recommendedProteinName.name,
                    EC: EC,
                    short: short,
                    synonymName: overview.recommendedProteinName.synonymName
                },
                "alternativeProteinNames": overview.alternativeProteinNames.map(function (p) {
                    return {name: p.name, short: p.synonyms}
                }),
                "geneName": overview.geneNames.map(function (o) {
                    return {
                        name: o.name,
                        synonyms: o.synonyms ? o.synonyms.filter(function (p) {
                            return p.category === "gene name"
                        }) : null,
                        orf: o.synonyms ? o.synonyms.filter(function (p) {
                            return p.category === "ORF"
                        }) : null
                    }
                }),
                "cleavage": overview.cleavedRegionNames,
                "family": overview.families,
                "proteineEvidence": overview.history.proteinExistence.split('_').join(' ').toLowerCase(),
                "integDate": overview.history.formattedNextprotIntegrationDate,
                "lastUpdate": overview.history.formattedNextprotUpdateDate,
                "version": overview.history.uniprotVersion,
                "UniprotIntegDate": overview.history.formattedUniprotIntegrationDate,
                "UniprotLastUpdate": overview.history.formattedUniprotUpdateDate,
                "seqVersion": overview.history.sequenceVersion,
                "accessionNumber": nxEntryName
            };


            var template = HBtemplates['templates/overviewProtein.tmpl'];
            var result = template(data);
            $("#nx-overview").append(result);

            $("#extender").click(function (event) {
                event.stopPropagation();
                //var isScrollbarActiveAtFirst= $(window).hasVerticalScrollBar();
                $("#INFOS-FULL").toggle("slow");
                $("#INFOS-LESS").toggle("slow");
                //var isScrollbarActiveAtEnd= $(window).hasVerticalScrollBar();
                //if ((isScrollbarActiveAtFirst) && isScrollbarActiveAtFirst !== isScrollbarActiveAtEnd) {
                //    $(body).removeClass("ignoreShift");
                //}
                //else if ((isScrollbarActiveAtFirst === false) && isScrollbarActiveAtFirst !== isScrollbarActiveAtEnd) {
                //    $(body).addClass("ignoreShift");
                //}
                $(this).text(function (i, text) {
                    return text === "Extend overview" ? "Collapse overview" : "Extend overview";
                });
            });
        }

    };

    if ($("#nx-overview")) { // laad the overview if it exists
        var Nextprot = window.Nextprot;
        var nx = new Nextprot.Client("neXtprot overview loader", "Calipho Group");
        var nxEntryName = nx.getEntryName();
        nx.getProteinOverview().then(function (data) {
            loadOverview(data, nxEntryName);

            var nxInputOption = nx.getInputOption();

            function addEntrySelection() {
                $("body").prepend("<div id=\"inputOptionDiv\" class=\"col-md-2 col-md-offset-5 centered\" style=\"position:absolute;padding:10px;padding-top:0px;z-index:12\">" +
                "<div class=\"panel panel-default\"><div class=\"panel-body\">" +
                "<input id=\"entrySelector\" type=\"text\" class=\"form-control\" placeholder=\"neXtProt or UniProt accession...\"></div>" +
                "</div></div>");
                $('#entrySelector').keyup(function (e) {
                    if (e.keyCode == 13) nx.changeEntry(this);
                })
            }

            if (nxInputOption === "true") {
                addEntrySelection();
                nx.getEntryProperties().then(function (data) {
                    $(function () {
                        $("#inputOptionDiv").append("<div class=\"alert alert-success entry-alert\" role=\"alert\" style=\"display:none\">You successfully load the entry !</div>");
                        $(".entry-alert").fadeIn("slow");
                        $(".entry-alert").delay(2000).fadeOut("slow");
                    });
                }, function (error) {
                    $(function () {
                        $("#inputOptionDiv").append("<div class=\"alert alert-danger entry-alert\" role=\"alert\">This accession is not available !</div>");
                    });
                    console.error("Failed!", error);
                });
            }

        });
    }

    if(nx.getEnvironment() !== 'pro'){
        $("body").append("<span style='position: absolute; top: 0; left: 0; border: 0; color: darkred; margin: 20px; font-weight: bold'>" + nx.getEnvironment().toUpperCase() + " API</span>");
    }

});