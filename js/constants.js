export const EXAMPLE_SESSIONS = [
  {
    name: "giab_hg008_gripss",
    description: "GIAB HG008 HiFi normal/tumor with gripss calls",
    bam: [
      "https://42basepairs.com/download/s3/giab/data_somatic/HG008/Liss_lab/BCM_Revio_20240313/HG008-N-D_PacBio-HiFi-Revio_20240313_68x_GRCh38-GIABv3.bam",
      "https://42basepairs.com/download/s3/giab/data_somatic/HG008/Liss_lab/BCM_Revio_20240313/HG008-T_PacBio-HiFi-Revio_20240313_106x_GRCh38-GIABv3.bam",
    ],
    vcf: [
      "https://ftp-trace.ncbi.nlm.nih.gov/ReferenceSamples/giab/data_somatic/HG008/Liss_lab/analysis/NCBI_Illumina_WGS_BCM_Somatic_SVs_GRIDSS2_Passage23_20240510/tumor.gripss.filtered.sv.annotated_Illumina_Passage23_GRCh38.vcf",
    ],
    coverage:
      "https://42basepairs.com/download/s3/giab-data/ribbon-json/splitthreader_HG008-T_BCMIllumina_195x.regions.bed",
    annotation_id: "GRCh38",
  },
  {
    name: "giab_hg008_dragen",
    description: "GIAB HG008 Tumor/Normal with DRAGEN calls",
    bam: [
      "https://42basepairs.com/download/s3/giab/data_somatic/HG008/Liss_lab/BCM_Revio_20240313/HG008-N-D_PacBio-HiFi-Revio_20240313_68x_GRCh38-GIABv3.bam",
      "https://42basepairs.com/download/s3/giab/data_somatic/HG008/Liss_lab/BCM_Revio_20240313/HG008-T_PacBio-HiFi-Revio_20240313_106x_GRCh38-GIABv3.bam",
    ],
    vcf: [
      "https://42basepairs.com/download/s3/giab/data_somatic/HG008/Liss_lab/analysis/DRAGEN-v4.2.4_ILMN-WGS_20240312/standard/dragen_4.2.4_HG008-mosaic_tumor.sv.vcf.gz",
    ],
    coverage:
      "https://42basepairs.com/download/s3/giab-data/ribbon-json/splitthreader_HG008-T_BCMIllumina_195x.regions.bed",
    annotation_id: "GRCh38",
  },
  {
    name: "giab_hg008_minda",
    description: "GIAB HG008 normal/tumor with Minda ensemble calls",
    bam: [
      "https://42basepairs.com/download/s3/giab/data_somatic/HG008/Liss_lab/BCM_Revio_20240313/HG008-N-D_PacBio-HiFi-Revio_20240313_68x_GRCh38-GIABv3.bam",
      "https://42basepairs.com/download/s3/giab/data_somatic/HG008/Liss_lab/BCM_Revio_20240313/HG008-T_PacBio-HiFi-Revio_20240313_106x_GRCh38-GIABv3.bam",
    ],
    bedpe: [
      "https://42basepairs.com/download/s3/giab-data/ribbon-json/HG008_minda_ensemble.vcf.bed",
    ],
    coverage:
      "https://42basepairs.com/download/s3/giab-data/ribbon-json/splitthreader_HG008-T_BCMIllumina_195x.regions.bed",
    annotation_id: "GRCh38",
  },
  {
    name: "skbr3",
    description: "SKBR3 for SplitThreader (no BAM for Ribbon)",
    bedpe: "/resources/examples/skbr3.bedpe.csv",
    coverage: "/resources/examples/skbr3.coverage.bed",
    annotation_id: "hg19",
  },
  // {
  //   name: "kitchen_sink", // for testing
  //   bam: [
  //     "https://42basepairs.com/download/s3/giab/data_somatic/HG008/Liss_lab/PacBio_Revio_20240125/HG008-T_PacBio-HiFi-Revio_20240125_116x_CHM13v2.0.bam",
  //   ],
  //   large_sv_vcf: [
  //     "https://42basepairs.com/download/s3/giab/data_somatic/HG008/Liss_lab/analysis/DRAGEN-v4.2.4_ILMN-WGS_20240312/standard/dragen_4.2.4_HG008-mosaic_tumor.sv.vcf.gz",
  //   ],
  //   // bedpe: "/resources/examples/skbr3.bedpe.csv",
  //   coverage: "/resources/examples/skbr3.coverage.bed",
  //   annotation_id: "GRCh38",
  // },
];
