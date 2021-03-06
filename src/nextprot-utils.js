//Utility methods
var NXUtils = {

    checkIsoformMatch: function (isoname, isonumber) {
        return isoname.endsWith("-" + isonumber)
    },

    getSequenceForIsoform: function (isoSequences, isoformName) {
        var result = null;
        //TODO allow users to specify isoform name without NX_
        //TODO the API should return the results in a sorted array

        if (typeof isoformName === "number") {
            isoSequences.forEach(function (d) {

                if (d.uniqueName.endsWith("-" + isoformName)) {
                    //console.log("returning" + d.sequence);
                    result = d.sequence;
                }
            });
        } else {
            isoSequences.forEach(function (d) {
                if (d.uniqueName === isoformName)
                    return d.sequence;
            })
        }
        return result;
    },
    getLinkForFeature: function (accession, description, type) {
        if (type === "peptide") {
            var url = "https://db.systemsbiology.net/sbeams/cgi/PeptideAtlas/GetPeptide?searchWithinThis=Peptide+Name&searchForThis=" + description + ";organism_name=Human";
            return "<a href='" + url + "'>" + description + "</a>";
        } else if (type === "antibody") {
            var url = accession;
            return "<a href='" + url + "'>" + description + "</a>";
        } else if (accession) {
            var url = "http://www.nextprot.org/db/term/" + accession;
            return "<a href='" + url + "'>" + description + "</a>";
        } else if (type === "publication") {
            var url = "http://www.nextprot.org/db/publication/" + accession;
            return "<a href='" + url + "'>" + description + "</a>";
        } else if (description) return description;
        else return "";
    },
    convertMappingsToIsoformMap: function (featMappings, category, group) {
        var mappings = jQuery.extend([], featMappings);
        var publiActive = false;
        if (!(featMappings instanceof Array)) {
            publiActive = true;
            mappings = jQuery.extend([], featMappings.annot);
        }
        var result = {};
        mappings.forEach(function (mapping) {
            if (mapping.hasOwnProperty("targetingIsoformsMap")) {
                for (var name in mapping.targetingIsoformsMap) {
                    if (mapping.targetingIsoformsMap.hasOwnProperty(name)) {
                        var start = mapping.targetingIsoformsMap[name].firstPosition,
                            end = mapping.targetingIsoformsMap[name].lastPosition,
                            link = NXUtils.getLinkForFeature(mapping.cvTermAccessionCode, mapping.description),
                            description = mapping.description,
                            quality = mapping.qualityQualifier !== "GOLD" ? mapping.qualityQualifier.toLowerCase() : "",
                            source = mapping.evidences.map(function (d) {
                                var pub = null;
                                var xref = null;
                                if (publiActive) {
                                    if (featMappings.publi[d.publicationMD5]) {
                                        pub = d.publicationMD5;
                                    }
                                    if (featMappings.xrefs[d.resourceId]) {
                                        xref = featMappings.xrefs[d.resourceId];
                                    }
                                    return {
                                        evidenceCodeName: d.evidenceCodeName,
                                        assignedBy: d.assignedBy,
                                        resourceDb: d.resourceDb,
                                        externalDb: d.resourceDb !== "UniProt",
                                        publicationMD5: d.publicationMD5,
                                        title: pub ? NXUtils.getLinkForFeature(featMappings.publi[pub].publicationId, featMappings.publi[pub].title, "publication") : "",
                                        authors: pub ? featMappings.publi[pub].authors.map(function (d) {
                                            return {
                                                lastName: d.lastName,
                                                initials: d.initials
                                            }
                                        }) : [],
                                        journal: pub ? featMappings.publi[pub].cvJournal ? featMappings.publi[pub].cvJournal.name : "" : "",
                                        volume: pub ? featMappings.publi[pub].volume : "",
                                        year: pub ? featMappings.publi[pub].publicationYear : "",
                                        firstPage: pub ? featMappings.publi[pub].firstPage : "",
                                        lastPage: pub ? (featMappings.publi[pub].lastPage === "" ? featMappings.publi[pub].firstPage : featMappings.publi[pub].lastPage) : "",
                                        pubId: pub ? featMappings.publi[pub].publicationId : "",
                                        abstract: pub ? featMappings.publi[pub].abstractText : "",
                                        dbXrefs: pub ? featMappings.publi[pub].dbXrefs.map(function (o) {
                                            return {
                                                name: o.databaseName === "DOI" ? "Full Text" : o.databaseName,
                                                url: o.resolvedUrl,
                                                accession: o.accession
                                            }
                                        }) : [],
                                        crossRef: xref ? {
                                            dbName: xref.databaseName,
                                            name: xref.accession,
                                            url: xref.resolvedUrl
                                        } : null
                                    }
                                } else return {
                                    evidenceCodeName: d.evidenceCodeName,
                                    assignedBy: d.assignedBy,
                                    publicationMD5: d.publicationMD5,
                                    title: "",
                                    authors: [],
                                    journal: "",
                                    volume: "",
                                    abstract: ""
                                }
                            }),
                            variant = false;
                        if (mapping.hasOwnProperty("variant") && !jQuery.isEmptyObject(mapping.variant)) {
                            link = "<span style='color:#00C500'>" + mapping.variant.original + " → " + mapping.variant.variant + "</span>";
                            description = "<span style=\"color:#00C500\">" + mapping.variant.original + " → " + mapping.variant.variant + "</span>  ";
                            variant = true;
                            if (mapping.description) {
                                var reg = /\[(.*?)\]/g;
                                var match = reg.exec(mapping.description);
                                var desc = mapping.description;
                                if (match) {
                                    var parseMatch = match[1].split(":");
                                    var desc = mapping.description.replace(/(\[.*?\])/g, NXUtils.getLinkForFeature(parseMatch[2], parseMatch[0]));

                                }
                                link += " ; " + desc;
                            }
                        }
                        if (!result[name]) result[name] = [];
                        result[name].push({
                            start: start,
                            end: end,
                            length: end - start + 1,
                            id: category.replace(/\s/g, '') + "_" + start.toString() + "_" + end.toString(),
                            description: description,
                            quality: quality,
                            category: category,
                            group: group,
                            link: link,
                            evidenceLength: source.length,
                            source: source,
                            variant: variant
                        });
                    }
                }
            }
            //TODO This is the old format, the API should evolve
            else if (mapping.hasOwnProperty("isoformSpecificity")) {
                for (var name in mapping.isoformSpecificity) {
                    if (mapping.isoformSpecificity.hasOwnProperty(name)) {
                        for (var i = 0; i < mapping.isoformSpecificity[name].positions.length; i++) {
                            var start = mapping.isoformSpecificity[name].positions[i].first,
                                end = mapping.isoformSpecificity[name].positions[i].second,
                                description = "",
                                link = "",
                                source = [];
                            if (mapping.hasOwnProperty("evidences")) {
                                source = mapping.evidences.map(function (d) {
                                    return {
                                        evidenceCodeName: d.evidenceCodeName,
                                        assignedBy: d.assignedBy,
                                        publicationMD5: d.publicationMD5
                                    }
                                });
                            }
                            if (mapping.hasOwnProperty("xrefs")) {
                                description = mapping.xrefs[0].accession;
                                link = NXUtils.getLinkForFeature(mapping.xrefs[0].resolvedUrl, description, "antibody")
                            } else {
                                description = mapping.evidences[0].accession;
                                for (ev in mapping.evidences)
                                    if (mapping.evidences[ev].databaseName === "PeptideAtlas" || mapping.evidences[ev].databaseName === "SRMAtlas") {
                                        description = mapping.evidences[ev].accession;
                                        link = NXUtils.getLinkForFeature(description, description, "peptide");

                                        break;
                                    }
                            }

                            if (!result[name]) result[name] = [];
                            result[name].push({
                                start: start,
                                end: end,
                                length: end - start,
                                id: category.replace(/\s/g, '') + "_" + start.toString() + "_" + end.toString(),
                                description: description,
                                category: category,
                                group: group,
                                link: link,
                                evidenceLength: source.length,
                                source: source
                            });
                        }
                    }
                }
            }
        });
        for (var iso in result) {
            result[iso].sort(function (a, b) {
                return a.start - b.start;
            })
        }
        return result;
    },
    convertPublications: function (publi, HashMD5) {
        for (var pub in publi) {
            HashMD5[publi[pub].md5] = {
                title: publi[pub].title,
                author: publi[pub].authors.map(function (d) {
                    return {
                        lastName: d.lastName,
                        initials: d.initials
                    }
                }),
                journal: publi[pub].cvJournal.name,
                volume: publi[pub].volume,
                abstract: publi[pub].abstractText
            }
        }

    },
    convertExonsMappingsToIsoformMap: function (mappings) {
        return mappings.map(function (d) {
            return {
                uniqueName: d.uniqueName,
                isoMainName: d.isoMainName,
                mapping: d.positionsOfIsoformOnReferencedGene.map(function (o) {
                    return {
                        start: o.key,
                        end: o.value
                    };
                })
            }
        })
    }
};

var NXViewerUtils = {
    convertNXAnnotations: function (annotations, metadata) {
        if (!annotations) return "Cannot load this";
        var result = {};
        for (name in annotations) {
            var meta = jQuery.extend({}, metadata);
            meta.data = annotations[name].map(function (annotation) {
                return {
                    x: annotation.start,
                    y: annotation.end,
                    id: annotation.id,
                    category: annotation.category,
                    description: annotation.description
                }
            });
            result[name] = meta;
        }
        return result;
    }
};