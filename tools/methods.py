unwanted_methods=["Oriented2-Monge", "OrientedPC-MLS", "OrientedWaveJets", "FO2D", "3DQuadric"]

all_methods = ["PCA", "3DQuadric", "Mean", "Cov2D", "NormCov2D", "NormCov3D", "ShapeOperator", "2-Monge", "Oriented2-Monge","FO2D", "PC-MLS", "OrientedPC-MLS", "JetFitting", "WaveJets", "OrientedWaveJets", "Sphere", "APSS", "UnorientedSphere", "ASO","Varifolds", "VCM", "AvgHexagram"]
mean_curvature_estimation=["PCA", "3DQuadric", "Mean", "Cov2D", "NormCov2D", "NormCov3D", "ShapeOperator", "2-Monge", "Oriented2-Monge","FO2D", "PC-MLS", "OrientedPC-MLS", "JetFitting", "WaveJets", "OrientedWaveJets", "Sphere", "APSS", "UnorientedSphere", "ASO","Varifolds", "VCM", "AvgHexagram"]
principal_curvature_estimation=["PCA", "3DQuadric", "Cov2D", "NormCov2D", "NormCov3D", "ShapeOperator", "2-Monge", "Oriented2-Monge","FO2D", "PC-MLS", "OrientedPC-MLS", "JetFitting", "WaveJets", "OrientedWaveJets", "ASO", "Varifolds", "VCM", "AvgHexagram"]
normal_estimation=["PCA", "3DQuadric", "WaveJets", "Mean", "2-Monge", "Oriented2-Monge","FO2D", "PC-MLS", "OrientedPC-MLS", "JetFitting", "Sphere", "APSS", "UnorientedSphere", "ASO", "Varifolds"]
curvature_direction=["PCA", "3DQuadric", "Cov2D", "NormCov2D", "NormCov3D", "ShapeOperator", "2-Monge", "Oriented2-Monge","FO2D", "PC-MLS", "OrientedPC-MLS", "JetFitting", "ASO", "Varifolds", "VCM", "AvgHexagram"]

mls_methods=["PC-MLS", "OrientedPC-MLS", "Sphere", "APSS", "UnorientedSphere", "ASO", "FO2D"]


references={
    "PCA" : ("\MtdCovPlane", "Hoppe1992"),
    "Mean": ("\MtdMean", "Pottmann2007"),
    "Cov2D": ("\MtdCovTwoD", "berkmann1994computation,Digne2014"),
    "NormCov2D": ("\MtdNormCovTwoD", "berkmann1994computation,Digne2014"),
    "NormCov3D": ("\MtdNormCovThreeD", "liang1990representation,Digne2014"),
    "NormalW":  ("\MtdNormalW", "Cheng2009"),                          # TODO
    "ShapeOperator": ("\MtdShapeOp", "Kalogerakis2007"),
    "2-Monge": ("\MtdMonge", "Gray1998"),
    "Oriented2-Monge": ("\MtdMonge", ""),
    "FO2D": ("\MtdPCMLS", ""),
    "PC-MLS": ("\MtdPCMLS", "Ridel2015"),
    "OrientedPC-MLS": ("\MtdPCMLS", ""),
    "JetFitting": ("\MtdJet", "Cazals2005"),
    "WaveJets": ("\MtdWaveJet", "Bearzi2018"),
    "PSS":("\MtdPSS", "Amenta2004"),                               # TODO
    "OrientedWaveJets": ("\MtdWaveJet", ""),
    "Sphere": ("\MtdSphere", "Guennebaud2007"),
    "APSS": ("\MtdAPSS", "Guennebaud2007"),
    "UnorientedSphere": ("\MtdUnorientedSphere", "Chen2013"),
    "ASO": ("\MtdASO", "Lejemble2021"),
    "3DQuadric": ("\MtdQuadricThreeD", "Khameneifar2018"),                     # TODO
    "Varifolds": ("\MtdVarifolds", "Buet2022"),
    "VCM": ("\MtdVCM", "Merigot2011"),
    "AvgHexagram": ("\MtdAvgHex","Lachaud2023")
}
