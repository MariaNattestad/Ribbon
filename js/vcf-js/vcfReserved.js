const vcfReserved = {
    // INFO fields
    InfoFields: {
        // from the VCF4.3 spec, https://samtools.github.io/hts-specs/VCFv4.3.pdf
        AA: { Number: 1, Type: 'String', Description: 'Ancestral allele' },
        AC: {
            Number: 'A',
            Type: 'Integer',
            Description: 'Allele count in genotypes, for each ALT allele, in the same order as listed',
        },
        AD: {
            Number: 'R',
            Type: 'Integer',
            Description: 'Total read depth for each allele',
        },
        ADF: {
            Number: 'R',
            Type: 'Integer',
            Description: 'Read depth for each allele on the forward strand',
        },
        ADR: {
            Number: 'R',
            Type: 'Integer',
            Description: 'Read depth for each allele on the reverse strand',
        },
        AF: {
            Number: 'A',
            Type: 'Float',
            Description: 'Allele frequency for each ALT allele in the same order as listed (estimated from primary data, not called genotypes)',
        },
        AN: {
            Number: 1,
            Type: 'Integer',
            Description: 'Total number of alleles in called genotypes',
        },
        BQ: {
            Number: 1,
            Type: 'Float',
            Description: 'RMS base quality',
        },
        CIGAR: {
            Number: 1,
            Type: 'Float',
            Description: 'Cigar string describing how to align an alternate allele to the reference allele',
        },
        DB: {
            Number: 0,
            Type: 'Flag',
            Description: 'dbSNP membership',
        },
        DP: {
            Number: 1,
            Type: 'Integer',
            Description: 'combined depth across samples',
        },
        END: {
            Number: 1,
            Type: 'Integer',
            Description: 'End position (for use with symbolic alleles)',
        },
        H2: {
            Number: 0,
            Type: 'Flag',
            Description: 'HapMap2 membership',
        },
        H3: {
            Number: 0,
            Type: 'Flag',
            Description: 'HapMap3 membership',
        },
        MQ: {
            Number: 1,
            Type: null,
            Description: 'RMS mapping quality',
        },
        MQ0: {
            Number: 1,
            Type: 'Integer',
            Description: 'Number of MAPQ == 0 reads',
        },
        NS: {
            Number: 1,
            Type: 'Integer',
            Description: 'Number of samples with data',
        },
        SB: {
            Number: 4,
            Type: 'Integer',
            Description: 'Strand bias',
        },
        SOMATIC: {
            Number: 0,
            Type: 'Flag',
            Description: 'Somatic mutation (for cancer genomics)',
        },
        VALIDATED: {
            Number: 0,
            Type: 'Flag',
            Description: 'Validated by follow-up experiment',
        },
        '1000G': {
            Number: 0,
            Type: 'Flag',
            Description: '1000 Genomes membership',
        },
        // specifically for structural variants
        IMPRECISE: {
            Number: 0,
            Type: 'Flag',
            Description: 'Imprecise structural variation',
        },
        NOVEL: {
            Number: 0,
            Type: 'Flag',
            Description: 'Indicates a novel structural variation',
        },
        // For precise variants, END is POS + length of REF allele - 1,
        // and the for imprecise variants the corresponding best estimate.
        SVTYPE: {
            Number: 1,
            Type: 'String',
            Description: 'Type of structural variant',
        },
        // Value should be one of DEL, INS, DUP, INV, CNV, BND. This key can
        // be derived from the REF/ALT fields but is useful for filtering.
        SVLEN: {
            Number: null,
            Type: 'Integer',
            Description: 'Difference in length between REF and ALT alleles',
        },
        // One value for each ALT allele. Longer ALT alleles (e.g. insertions)
        // have positive values, shorter ALT alleles (e.g. deletions)
        // have negative values.
        CIPOS: {
            Number: 2,
            Type: 'Integer',
            Description: 'Confidence interval around POS for imprecise variants',
        },
        CIEND: {
            Number: 2,
            Type: 'Integer',
            Description: 'Confidence interval around END for imprecise variants',
        },
        HOMLEN: {
            Type: 'Integer',
            Description: 'Length of base pair identical micro-homology at event breakpoints',
        },
        HOMSEQ: {
            Type: 'String',
            Description: 'Sequence of base pair identical micro-homology at event breakpoints',
        },
        BKPTID: {
            Type: 'String',
            Description: 'ID of the assembled alternate allele in the assembly file',
        },
        // For precise variants, the consensus sequence the alternate allele assembly
        // is derivable from the REF and ALT fields. However, the alternate allele
        // assembly file may contain additional information about the characteristics
        // of the alt allele contigs.
        MEINFO: {
            Number: 4,
            Type: 'String',
            Description: 'Mobile element info of the form NAME,START,END,POLARITY',
        },
        METRANS: {
            Number: 4,
            Type: 'String',
            Description: 'Mobile element transduction info of the form CHR,START,END,POLARITY',
        },
        DGVID: {
            Number: 1,
            Type: 'String',
            Description: 'ID of this element in Database of Genomic Variation',
        },
        DBVARID: {
            Number: 1,
            Type: 'String',
            Description: 'ID of this element in DBVAR',
        },
        DBRIPID: {
            Number: 1,
            Type: 'String',
            Description: 'ID of this element in DBRIP',
        },
        MATEID: {
            Number: null,
            Type: 'String',
            Description: 'ID of mate breakends',
        },
        PARID: {
            Number: 1,
            Type: 'String',
            Description: 'ID of partner breakend',
        },
        EVENT: {
            Number: 1,
            Type: 'String',
            Description: 'ID of event associated to breakend',
        },
        CILEN: {
            Number: 2,
            Type: 'Integer',
            Description: 'Confidence interval around the inserted material between breakend',
        },
        DPADJ: { Type: 'Integer', Description: 'Read Depth of adjacency' },
        CN: {
            Number: 1,
            Type: 'Integer',
            Description: 'Copy number of segment containing breakend',
        },
        CNADJ: {
            Number: null,
            Type: 'Integer',
            Description: 'Copy number of adjacency',
        },
        CICN: {
            Number: 2,
            Type: 'Integer',
            Description: 'Confidence interval around copy number for the segment',
        },
        CICNADJ: {
            Number: null,
            Type: 'Integer',
            Description: 'Confidence interval around copy number for the adjacency',
        },
    },
    // FORMAT fields
    GenotypeFields: {
        // from the VCF4.3 spec, https://samtools.github.io/hts-specs/VCFv4.3.pdf
        AD: {
            Number: 'R',
            Type: 'Integer',
            Description: 'Read depth for each allele',
        },
        ADF: {
            Number: 'R',
            Type: 'Integer',
            Description: 'Read depth for each allele on the forward strand',
        },
        ADR: {
            Number: 'R',
            Type: 'Integer',
            Description: 'Read depth for each allele on the reverse strand',
        },
        DP: {
            Number: 1,
            Type: 'Integer',
            Description: 'Read depth',
        },
        EC: {
            Number: 'A',
            Type: 'Integer',
            Description: 'Expected alternate allele counts',
        },
        FT: {
            Number: 1,
            Type: 'String',
            Description: 'Filter indicating if this genotype was "called"',
        },
        GL: {
            Number: 'G',
            Type: 'Float',
            Description: 'Genotype likelihoods',
        },
        GP: {
            Number: 'G',
            Type: 'Float',
            Description: 'Genotype posterior probabilities',
        },
        GQ: {
            Number: 1,
            Type: 'Integer',
            Description: 'Conditional genotype quality',
        },
        GT: {
            Number: 1,
            Type: 'String',
            Description: 'Genotype',
        },
        HQ: {
            Number: 2,
            Type: 'Integer',
            Description: 'Haplotype quality',
        },
        MQ: {
            Number: 1,
            Type: 'Integer',
            Description: 'RMS mapping quality',
        },
        PL: {
            Number: 'G',
            Type: 'Integer',
            Description: 'Phred-scaled genotype likelihoods rounded to the closest integer',
        },
        PQ: {
            Number: 1,
            Type: 'Integer',
            Description: 'Phasing quality',
        },
        PS: {
            Number: 1,
            Type: 'Integer',
            Description: 'Phase set',
        },
    },
    // ALT fields
    AltTypes: {
        DEL: {
            Description: 'Deletion relative to the reference',
        },
        INS: {
            Description: 'Insertion of novel sequence relative to the reference',
        },
        DUP: {
            Description: 'Region of elevated copy number relative to the reference',
        },
        INV: {
            Description: 'Inversion of reference sequence',
        },
        CNV: {
            Description: 'Copy number variable region (may be both deletion and duplication)',
        },
        'DUP:TANDEM': {
            Description: 'Tandem duplication',
        },
        'DEL:ME': {
            Description: 'Deletion of mobile element relative to the reference',
        },
        'INS:ME': {
            Description: 'Insertion of a mobile element relative to the reference',
        },
        NON_REF: {
            Description: 'Represents any possible alternative allele at this location',
        },
        '*': {
            Description: 'Represents any possible alternative allele at this location',
        },
    },
    // FILTER fields
    FilterTypes: {
        PASS: {
            Description: 'Passed all filters',
        },
    },
};
//# sourceMappingURL=vcfReserved.js.map