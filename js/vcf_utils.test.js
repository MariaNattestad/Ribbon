import { expect, test } from 'vitest';

import {
	parse_whole_vcf,
	convert_to_splitthreader_format,
	extract_bnd_info_to_strands,
	parse_and_convert_vcf
} from './vcf_utils';

const sample_vcf_header = `##fileformat=VCFv4.2
##FILTER=<ID=PASS,Description="All filters passed">
##fileDate=20240223
##DRAGENVersion=<ID=dragen,Version="SW: 4.2.4, HW: Unknown">
##DRAGENCommandLine=<ID=dragen,Date="Fri Feb 23 14:02:52 PST 2024",CommandLineOptions="--tumor-bam-input=/staging/tmp/suite_def/illumina-isi07/scratch/dragen_team_share1/users/fbrundu/NIST_GIAB/HG008-T-mosaic/HG008-T-mosaic.bam --bam-input=/staging/tmp/suite_def/illumina-isi07/scratch/dragen_datasets/repo/somatic_snv/cancer_data/HG008_TN/HG008-N.bam --ref-dir=/staging/tmp/suite_def/illumina-isi07/scratch/dragen_datasets/data/vault/reference_genomes/Hsapiens/hg38-alt_masked.cnv.hla.rna_v3/DRAGEN/9 --vc-systematic-noise=/staging/tmp/suite_def/illumina-isi07/scratch/cOncWGTS/systematic_noise/WGS/noise_files/hg38/hg38-WGS_max-snv_systematic_noise-v1.1.0.bed.gz --enable-performance-monitoring=true --output-file-prefix=run_dragen-HG008-mosaic_tumor-suite10234695-stage2 --events-log-file=/staging/tmp/suite_def/prod/10234695/002_Somatic_TN_VC_SV_CNV_HG008_mosaic_tumor/_application_debug/dragen_events.csv --output-directory=/staging/tmp/suite_def/prod/10234695/002_Somatic_TN_VC_SV_CNV_HG008_mosaic_tumor/_application_output --enable-metrics-json=true --vc-enable-profile-stats=true --enable-cnv=true --cnv-merge-distance=2000000 --cnv-filter-length=50000 --cnv-somatic-enable-het-calling=true --cnv-use-somatic-vc-baf=true --cnv-somatic-het-state-multiplier=3 --enable-sv=true --enable-variant-deduplication=true --enable-variant-caller=true --enable-vcf-compression=true --enable-map-align=false --enable-save-bed-file=true --enable-sort=false --enable-duplicate-marking=false">
##source=DRAGEN_SV
##reference=file:///staging/tmp/suite_def/illumina-isi07/scratch/dragen_datasets/data/vault/reference_genomes/Hsapiens/hg38-alt_masked.cnv.hla.rna_v3/DRAGEN/9
##contig=<ID=chr1,length=248956422>
##contig=<ID=chr2,length=242193529>
##contig=<ID=chr3,length=198295559>
##contig=<ID=chr4,length=190214555>
##contig=<ID=chr5,length=181538259>
##contig=<ID=chr6,length=170805979>
##contig=<ID=chr7,length=159345973>
##contig=<ID=chr8,length=145138636>
##contig=<ID=chr9,length=138394717>
##contig=<ID=chr10,length=133797422>
##contig=<ID=chr11,length=135086622>
##contig=<ID=chr12,length=133275309>
##contig=<ID=chr13,length=114364328>
##contig=<ID=chr14,length=107043718>
##contig=<ID=chr15,length=101991189>
##contig=<ID=chr16,length=90338345>
##contig=<ID=chr17,length=83257441>
##contig=<ID=chr18,length=80373285>
##contig=<ID=chr19,length=58617616>
##contig=<ID=chr20,length=64444167>
##contig=<ID=chr21,length=46709983>
##contig=<ID=chr22,length=50818468>
##contig=<ID=chrX,length=156040895>
##contig=<ID=chrY,length=57227415>
##contig=<ID=chrM,length=16569>
##INFO=<ID=IMPRECISE,Number=0,Type=Flag,Description="Imprecise structural variation">
##INFO=<ID=SVTYPE,Number=1,Type=String,Description="Type of structural variant">
##INFO=<ID=SVLEN,Number=.,Type=Integer,Description="Difference in length between REF and ALT alleles">
##INFO=<ID=END,Number=1,Type=Integer,Description="End position of the variant described in this record">
##INFO=<ID=CIPOS,Number=2,Type=Integer,Description="Confidence interval around POS">
##INFO=<ID=CIEND,Number=2,Type=Integer,Description="Confidence interval around END">
##INFO=<ID=CIGAR,Number=A,Type=String,Description="CIGAR alignment for each alternate indel allele">
##INFO=<ID=MATEID,Number=.,Type=String,Description="ID of mate breakend">
##INFO=<ID=EVENT,Number=1,Type=String,Description="ID of event associated to breakend">
##INFO=<ID=HOMLEN,Number=.,Type=Integer,Description="Length of base pair identical homology at event breakpoints">
##INFO=<ID=HOMSEQ,Number=.,Type=String,Description="Sequence of base pair identical homology at event breakpoints">
##INFO=<ID=SVINSLEN,Number=.,Type=Integer,Description="Length of insertion">
##INFO=<ID=SVINSSEQ,Number=.,Type=String,Description="Sequence of insertion">
##INFO=<ID=LEFT_SVINSSEQ,Number=.,Type=String,Description="Known left side of insertion for an insertion of unknown length">
##INFO=<ID=RIGHT_SVINSSEQ,Number=.,Type=String,Description="Known right side of insertion for an insertion of unknown length">
##INFO=<ID=DUPSVLEN,Number=.,Type=Integer,Description="Length of duplicated reference sequence">
##INFO=<ID=DUPSVINSLEN,Number=.,Type=Integer,Description="Length of inserted sequence after duplicated reference sequence">
##INFO=<ID=DUPSVINSSEQ,Number=.,Type=String,Description="Inserted sequence after duplicated reference sequence">
##INFO=<ID=DUPHOMLEN,Number=.,Type=Integer,Description="Length of base pair identical homology at event breakpoints excluding duplicated reference sequence">
##INFO=<ID=DUPHOMSEQ,Number=.,Type=String,Description="Sequence of base pair identical homology at event breakpoints excluding duplicated reference sequence">
##INFO=<ID=hotspot,Number=0,Type=Flag,Description="Somatic hotspot scoring applied to this variant">
##INFO=<ID=BND_DEPTH,Number=1,Type=Integer,Description="Read depth at local translocation breakend">
##INFO=<ID=MATE_BND_DEPTH,Number=1,Type=Integer,Description="Read depth at remote translocation mate breakend">
##INFO=<ID=SOMATIC,Number=0,Type=Flag,Description="Somatic mutation">
##INFO=<ID=SOMATICSCORE,Number=1,Type=Integer,Description="Somatic variant quality score">
##INFO=<ID=JUNCTION_SOMATICSCORE,Number=1,Type=Integer,Description="If the SV junction is part of an EVENT (ie. a multi-adjacency variant), this field provides the SOMATICSCORE value for the adjacency in question only">
##INFO=<ID=INV3,Number=0,Type=Flag,Description="Inversion breakends open 3' of reported location">
##INFO=<ID=INV5,Number=0,Type=Flag,Description="Inversion breakends open 5' of reported location">
##FORMAT=<ID=PR,Number=.,Type=Integer,Description="Spanning paired-read support for the ref and alt alleles in the order listed">
##FORMAT=<ID=SR,Number=.,Type=Integer,Description="Split reads for the ref and alt alleles in the order listed, for reads where P(allele|read)>0.999">
##FILTER=<ID=MaxDepth,Description="Normal sample site depth is greater than 3x the median chromosome depth near one or both variant breakends (not applied to records with KnownSVScoring flag)">
##FILTER=<ID=MinSomaticScore,Description="Somatic score is less than 35 (not applied to records with hotspot flag)">
##FILTER=<ID=MaxMQ0Frac,Description="For a small variant (<1000 bases) in the normal sample, the fraction of reads with MAPQ0 around either breakend exceeds 0.4 (not applied to records with KnownSVScoring flag)">
##ALT=<ID=INV,Description="Inversion">
##ALT=<ID=DEL,Description="Deletion">
##ALT=<ID=INS,Description="Insertion">
##ALT=<ID=DUP:TANDEM,Description="Tandem Duplication">
##bcftools_viewVersion=1.14+htslib-1.14
##bcftools_viewCommand=view -h dragen_4.2.4_HG008-mosaic_tumor.sv.vcf.gz; Date=Wed Aug 21 14:52:47 2024
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO	FORMAT	HG008-N	HG008-T-mosaic`;

const sample_vcf_body = `chr1	2401265	DRAGEN:INS:59677:0:0:0:15:0	C	<INS>	.	PASS	END=2401267;SVTYPE=INS;LEFT_SVINSSEQ=TCCCTCCTCCTAGATCGGAAGAGCGTCGTGTAGGGAAAGAGTGTAAGATACTGTGTAGATCTCGGTGGTCGC;RIGHT_SVINSSEQ=CCCTCCGTCCCTCCCTCCTCCTCCCTCCTTCCTCCCTCCTCCTCCCTCCTCCTCCCTCCTCCCTTCTTCCTCCCTCCTCCTCCCTTCTTCCTCCTCCTCCCTCCTCCCCCTCCTCCCTCCCCCT;SOMATIC;SOMATICSCORE=45	PR:SR	27,2:1,0	28,5:0,12
chr1	9959242	DRAGEN:DEL:61508:0:0:0:3:0	GGCGCCTGTAATCCCAGCTACTCAGGAGGCTGAAGCAGAAGAATCGCTTGAACCCGGGAGGCAGAGGTTGCAGTGAGCTGAGATCGTGCCATTGCACTACAGCCAGGGGACAAGAGTGAAACTCCATCTTGGAAAAAAAAAAAAAAAAAAAAAAAAAGAGGCCGGGTGCGGTGACTCACGCCTATAATCCTAGCACTTTGGGAGGCCAAAGTAGGCAGATCATGAGGTCAGGAGTTCAAGACCAGCATGACCAATATGGTGAAACCCCATCTCTACTAAAAATACAAAAATTAGCTGGGCGTGGTGGCAT	G	.	MinSomaticScore	END=9959551;SVTYPE=DEL;SVLEN=-309;CIGAR=1M309D;CIPOS=0,32;HOMLEN=32;HOMSEQ=GCGCCTGTAATCCCAGCTACTCAGGAGGCTGA;SOMATIC;SOMATICSCORE=16	PR:SR	149,1:149,6	209,8:170,7
chr1	23272628	DRAGEN:BND:63885:0:1:0:0:0:0	G	G]chr5:52747359]	.	PASS	SVTYPE=BND;MATEID=DRAGEN:BND:63885:0:1:0:0:0:1;SOMATIC;SOMATICSCORE=381;BND_DEPTH=127;MATE_BND_DEPTH=136	PR:SR	171,0:183,0	137,48:148,69
chr1	41531522	DRAGEN:DEL:66378:0:0:0:3:0	GGAGAGATGGAGGACAGGGGAGATGGAGGACAGGAGAGATGGAAGACAGGGGAGATGGAGGACAGGAGAGATGGAGGACAGGGGAGATGGAGGACAGGAGAGATGGAAGAC	G	.	PASS	END=41531632;SVTYPE=DEL;SVLEN=-110;CIGAR=1M110D;CIPOS=0,1;HOMLEN=1;HOMSEQ=G;SOMATIC;SOMATICSCORE=41	PR:SR	15,0:38,3	4,0:7,18
chr1	72195288	DRAGEN:DEL:69328:0:1:0:0:0	T	<DEL>	.	PASS	END=72215499;SVTYPE=DEL;SVLEN=-20211;SVINSLEN=2;SVINSSEQ=TA;SOMATIC;SOMATICSCORE=346	PR:SR	200,0:223,0	64,20:56,38
chr1	105963165	DRAGEN:BND:89:4025:4028:1:0:0:0	A	]chr13:86115338]A	.	PASS	SVTYPE=BND;MATEID=DRAGEN:BND:89:4025:4028:1:0:0:1;IMPRECISE;CIPOS=-187,187;EVENT=DRAGEN:BND:89:4025:4028:0:0:0:0;SOMATIC;SOMATICSCORE=40;JUNCTION_SOMATICSCORE=0;BND_DEPTH=106;MATE_BND_DEPTH=98	PR	119,0	161,4
chr1	105963430	DRAGEN:BND:89:4025:4028:0:0:0:1	G	G[chr13:86114871[	.	PASS	SVTYPE=BND;MATEID=DRAGEN:BND:89:4025:4028:0:0:0:0;IMPRECISE;CIPOS=-229,229;EVENT=DRAGEN:BND:89:4025:4028:0:0:0:0;SOMATIC;SOMATICSCORE=40;JUNCTION_SOMATICSCORE=0;BND_DEPTH=92;MATE_BND_DEPTH=95	PR	98,1	132,4
chr1	151220118	DRAGEN:DEL:75749:0:0:0:0:0	GCCTCAGTCTCCCGAGTAGCTGGGATTACAGGTGGTGTCATCATGCTTGGCTACTTTTTTGTATTTTTAGTAGAGACGGGGTTTCACCTTGCTAGCCAGGATGATCTCGATCTCCTGACCCTGTGATATGCCCACCTTGGCCTCCCCAAGTGCTGGGATTACAGGCATGAGCC	G	.	PASS	END=151220290;SVTYPE=DEL;SVLEN=-172;CIGAR=1M172D;SOMATIC;SOMATICSCORE=167	PR:SR	93,8:178,0	80,18:135,43
chr1	160367322	DRAGEN:DUP:TANDEM:77083:0:1:0:0:0	G	<DUP:TANDEM>	.	PASS	END=160693915;SVTYPE=DUP;SVLEN=326593;CIPOS=0,3;CIEND=0,3;HOMLEN=3;HOMSEQ=ACA;SOMATIC;SOMATICSCORE=239	PR:SR	206,0:237,0	287,49:243,44
chr1	184410631	DRAGEN:INS:79820:0:0:0:17:0	A	<INS>	.	MinSomaticScore	END=184410633;SVTYPE=INS;LEFT_SVINSSEQ=ATATATATATATTATATATATATAATATATATATATTATATATATATATAATATATATATATTATATATATATAATATATATATATATTATATATATA;RIGHT_SVINSSEQ=TATATAATATATATATATATTATATATATATAATATATATATATAATATATATATATTATATATATATATTATATATATATATAATATATATATAT;SOMATIC;SOMATICSCORE=13	PR:SR	5,0:2,0	11,1:7,11
chr2	80401504	DRAGEN:INV:99398:0:0:3:1:0	C	<INV>	.	PASS	END=80401783;SVTYPE=INV;SVLEN=279;SVINSLEN=6;SVINSSEQ=ATGAGG;SOMATIC;SOMATICSCORE=193;INV5	PR:SR	190,0:235,0	150,10:156,49`;

test('parse_whole_vcf', () => {
	const records = parse_whole_vcf(sample_vcf_header, sample_vcf_body);
	expect(records.length).toBe(11);
});

test('convert_to_splitthreader_format BND', () => {
	const bnd_row =
		'chr1	23272628	DRAGEN:BND:63885:0:1:0:0:0:0	G	G]chr5:52747359]	.	PASS	SVTYPE=BND;MATEID=DRAGEN:BND:63885:0:1:0:0:0:1;SOMATIC;SOMATICSCORE=381;BND_DEPTH=127;MATE_BND_DEPTH=136	PR:SR	171,0:183,0	137,48:148,69';
	const records = parse_whole_vcf(sample_vcf_header, bnd_row);
	expect(records.length).toBe(1);
	const splitthreader_format = convert_to_splitthreader_format(records[0]);
	expect(splitthreader_format).toEqual({
		chrom1: 'chr1',
		pos1: 23272628,
		chrom2: 'chr5',
		pos2: 52747359,
		strand1: '+',
		strand2: '+',
		split: 127,
		variant_type: 'BND',
		svtype: 'BND',
		name: 'DRAGEN:BND:63885:0:1:0:0:0:0',
		variant_name: 'DRAGEN:BND:63885:0:1:0:0:0:0'
	});
});

test.each([
	{ alt: 'G]chr5:52747359]', strand1: '+', strand2: '+' },
	{ alt: ']13:123456]T', strand1: '-', strand2: '+' },
	{ alt: 'T[13:123456[', strand1: '+', strand2: '-' },
	{ alt: '[17:198983[A', strand1: '-', strand2: '-' }
])('extract_bnd_info_to_strands (%s)', ({ alt, strand1, strand2 }) => {
	const parsed_breakend = extract_bnd_info_to_strands(alt);
	expect(parsed_breakend.strand1).toBe(strand1);
	expect(parsed_breakend.strand2).toBe(strand2);
});

test('parse_and_convert_vcf', () => {
	const splitthreader_format = parse_and_convert_vcf(sample_vcf_header, sample_vcf_body);
	expect(splitthreader_format.length).toBe(11);
	console.warn('splitthreader_format:', splitthreader_format);
	const expected_keys = [
		'chrom1',
		'pos1',
		'chrom2',
		'pos2',
		'strand1',
		'strand2',
		'split',
		'svtype',
		'variant_name',
		'name',
		'variant_type'
	];
	for (const record of splitthreader_format) {
		for (const key of expected_keys) {
			let msg = `Expected key "${key}" to be defined in record ${JSON.stringify(record)}`;
			expect(record[key], msg).toBeDefined();
		}
	}
});
