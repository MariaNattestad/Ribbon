export const EXAMPLE_SESSIONS = [
  {
    name: "giab_hg008",
    description: "Revio HG008 Tumor/Normal",
    bam: [
      "https://42basepairs.com/download/s3/giab/data_somatic/HG008/Liss_lab/PacBio_Revio_20240125/HG008-T_PacBio-HiFi-Revio_20240125_116x_GRCh38-GIABv3.bam",
      "https://42basepairs.com/download/s3/giab/data_somatic/HG008/Liss_lab/PacBio_Revio_20240125/HG008-N-P_PacBio-HiFi-Revio_20240125_35x_GRCh38-GIABv3.bam"
    ],
    vcf: [
      "https://42basepairs.com/download/s3/giab/data_somatic/HG008/Liss_lab/analysis/DRAGEN-v4.2.4_ILMN-WGS_20240312/standard/dragen_4.2.4_HG008-mosaic_tumor.sv.vcf.gz",
    ],
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
  //   name: "bedpe without coverage",
  //   bedpe: "/resources/examples/skbr3.bedpe.csv",
  //   // coverage: "/resources/examples/skbr3.coverage.bed",
  // },
  // {
  //   name: "coverage without bedpe",
  //   // bedpe: "/resources/examples/skbr3.bedpe.csv",
  //   coverage: "/resources/examples/skbr3.coverage.bed",
  // },
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
