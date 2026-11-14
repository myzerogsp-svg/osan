import { shownSite } from "./productivity.ts";
import { linesOf, setCenterLines } from "./sites.ts";
import { onSharedPanel, readPanel, writePanel, type PanelLayoutLine } from "./panel-store.ts";

export type LocSlot = { kind: "loc"; code: string } | { kind: "pillar"; span?: number } | { kind: "blank" };

export type LineLayout = { line: number; left: LocSlot[]; right: LocSlot[] };

export const CENTER_12_LAYOUT: LineLayout[] = [
  { line: 1, left: [{ kind: "loc", code: "0139" }, { kind: "loc", code: "0138" }, { kind: "loc", code: "0137" }, { kind: "loc", code: "0136" }, { kind: "loc", code: "0135" }, { kind: "loc", code: "0134" }, { kind: "loc", code: "0133" }, { kind: "loc", code: "0132" }, { kind: "loc", code: "0131" }, { kind: "loc", code: "0130" }, { kind: "loc", code: "0129" }, { kind: "loc", code: "0128" }, { kind: "loc", code: "0127" }, { kind: "loc", code: "0126" }, { kind: "loc", code: "0125" }, { kind: "loc", code: "0124" }, { kind: "loc", code: "0123" }, { kind: "loc", code: "0122" }, { kind: "loc", code: "0121" }, { kind: "loc", code: "0120" }, { kind: "loc", code: "0119" }, { kind: "loc", code: "0118" }, { kind: "loc", code: "0117" }, { kind: "loc", code: "0116" }, { kind: "loc", code: "0115" }, { kind: "loc", code: "0114" }, { kind: "loc", code: "0113" }, { kind: "loc", code: "0112" }, { kind: "loc", code: "0111" }, { kind: "loc", code: "0110" }, { kind: "loc", code: "0109" }, { kind: "loc", code: "0108" }, { kind: "loc", code: "0107" }, { kind: "loc", code: "0106" }, { kind: "loc", code: "0105" }, { kind: "loc", code: "0104" }, { kind: "loc", code: "0103" }, { kind: "loc", code: "0102" }, { kind: "loc", code: "0101" }], right: [{ kind: "loc", code: "0189" }, { kind: "loc", code: "0188" }, { kind: "loc", code: "0187" }, { kind: "loc", code: "0186" }, { kind: "loc", code: "0185" }, { kind: "loc", code: "0184" }, { kind: "loc", code: "0183" }, { kind: "loc", code: "0182" }, { kind: "loc", code: "0181" }, { kind: "loc", code: "0180" }, { kind: "loc", code: "0179" }, { kind: "loc", code: "0178" }, { kind: "loc", code: "0177" }, { kind: "loc", code: "0176" }, { kind: "loc", code: "0175" }, { kind: "loc", code: "0174" }, { kind: "loc", code: "0173" }, { kind: "loc", code: "0172" }, { kind: "loc", code: "0171" }, { kind: "loc", code: "0170" }, { kind: "loc", code: "0169" }, { kind: "loc", code: "0168" }, { kind: "loc", code: "0167" }, { kind: "loc", code: "0166" }, { kind: "loc", code: "0165" }, { kind: "loc", code: "0164" }, { kind: "loc", code: "0163" }, { kind: "loc", code: "0162" }, { kind: "loc", code: "0161" }, { kind: "loc", code: "0160" }, { kind: "loc", code: "0159" }, { kind: "loc", code: "0158" }, { kind: "loc", code: "0157" }, { kind: "loc", code: "0156" }, { kind: "loc", code: "0155" }, { kind: "loc", code: "0154" }, { kind: "loc", code: "0153" }, { kind: "loc", code: "0152" }, { kind: "loc", code: "0151" }] },
  { line: 2, left: [{ kind: "loc", code: "0239" }, { kind: "loc", code: "0238" }, { kind: "loc", code: "0237" }, { kind: "loc", code: "0236" }, { kind: "loc", code: "0235" }, { kind: "loc", code: "0234" }, { kind: "loc", code: "0233" }, { kind: "loc", code: "0232" }, { kind: "loc", code: "0231" }, { kind: "loc", code: "0230" }, { kind: "loc", code: "0229" }, { kind: "loc", code: "0228" }, { kind: "loc", code: "0227" }, { kind: "loc", code: "0226" }, { kind: "loc", code: "0225" }, { kind: "loc", code: "0224" }, { kind: "loc", code: "0223" }, { kind: "loc", code: "0222" }, { kind: "loc", code: "0221" }, { kind: "loc", code: "0220" }, { kind: "loc", code: "0219" }, { kind: "loc", code: "0218" }, { kind: "loc", code: "0217" }, { kind: "loc", code: "0216" }, { kind: "loc", code: "0215" }, { kind: "loc", code: "0214" }, { kind: "loc", code: "0213" }, { kind: "loc", code: "0212" }, { kind: "loc", code: "0211" }, { kind: "loc", code: "0210" }, { kind: "loc", code: "0209" }, { kind: "loc", code: "0208" }, { kind: "loc", code: "0207" }, { kind: "loc", code: "0206" }, { kind: "loc", code: "0205" }, { kind: "loc", code: "0204" }, { kind: "loc", code: "0203" }, { kind: "loc", code: "0202" }, { kind: "loc", code: "0201" }], right: [{ kind: "loc", code: "0289" }, { kind: "loc", code: "0288" }, { kind: "loc", code: "0287" }, { kind: "loc", code: "0286" }, { kind: "loc", code: "0285" }, { kind: "loc", code: "0284" }, { kind: "loc", code: "0283" }, { kind: "loc", code: "0282" }, { kind: "loc", code: "0281" }, { kind: "loc", code: "0280" }, { kind: "loc", code: "0279" }, { kind: "loc", code: "0278" }, { kind: "loc", code: "0277" }, { kind: "loc", code: "0276" }, { kind: "loc", code: "0275" }, { kind: "loc", code: "0274" }, { kind: "loc", code: "0273" }, { kind: "loc", code: "0272" }, { kind: "loc", code: "0271" }, { kind: "loc", code: "0270" }, { kind: "loc", code: "0269" }, { kind: "loc", code: "0268" }, { kind: "loc", code: "0267" }, { kind: "loc", code: "0266" }, { kind: "loc", code: "0265" }, { kind: "loc", code: "0264" }, { kind: "loc", code: "0263" }, { kind: "loc", code: "0262" }, { kind: "loc", code: "0261" }, { kind: "loc", code: "0260" }, { kind: "loc", code: "0259" }, { kind: "loc", code: "0258" }, { kind: "loc", code: "0257" }, { kind: "loc", code: "0256" }, { kind: "loc", code: "0255" }, { kind: "loc", code: "0254" }, { kind: "loc", code: "0253" }, { kind: "loc", code: "0252" }, { kind: "loc", code: "0251" }] },
  { line: 3, left: [{ kind: "loc", code: "0337" }, { kind: "loc", code: "0336" }, { kind: "loc", code: "0335" }, { kind: "loc", code: "0334" }, { kind: "loc", code: "0333" }, { kind: "loc", code: "0332" }, { kind: "loc", code: "0331" }, { kind: "loc", code: "0330" }, { kind: "loc", code: "0329" }, { kind: "loc", code: "0328" }, { kind: "loc", code: "0327" }, { kind: "loc", code: "0326" }, { kind: "loc", code: "0325" }, { kind: "loc", code: "0324" }, { kind: "loc", code: "0323" }, { kind: "loc", code: "0322" }, { kind: "loc", code: "0321" }, { kind: "loc", code: "0320" }, { kind: "loc", code: "0319" }, { kind: "pillar", span: 2 }, { kind: "loc", code: "0318" }, { kind: "loc", code: "0317" }, { kind: "loc", code: "0316" }, { kind: "loc", code: "0315" }, { kind: "loc", code: "0314" }, { kind: "loc", code: "0313" }, { kind: "loc", code: "0312" }, { kind: "loc", code: "0311" }, { kind: "loc", code: "0310" }, { kind: "loc", code: "0309" }, { kind: "loc", code: "0308" }, { kind: "loc", code: "0307" }, { kind: "loc", code: "0306" }, { kind: "loc", code: "0305" }, { kind: "loc", code: "0304" }, { kind: "loc", code: "0303" }, { kind: "loc", code: "0302" }, { kind: "loc", code: "0301" }], right: [{ kind: "loc", code: "0389" }, { kind: "loc", code: "0388" }, { kind: "loc", code: "0387" }, { kind: "loc", code: "0386" }, { kind: "loc", code: "0385" }, { kind: "loc", code: "0384" }, { kind: "loc", code: "0383" }, { kind: "loc", code: "0382" }, { kind: "loc", code: "0381" }, { kind: "loc", code: "0380" }, { kind: "loc", code: "0379" }, { kind: "loc", code: "0378" }, { kind: "loc", code: "0377" }, { kind: "loc", code: "0376" }, { kind: "loc", code: "0375" }, { kind: "loc", code: "0374" }, { kind: "loc", code: "0373" }, { kind: "loc", code: "0372" }, { kind: "loc", code: "0371" }, { kind: "loc", code: "0370" }, { kind: "loc", code: "0369" }, { kind: "loc", code: "0368" }, { kind: "loc", code: "0367" }, { kind: "loc", code: "0366" }, { kind: "loc", code: "0365" }, { kind: "loc", code: "0364" }, { kind: "loc", code: "0363" }, { kind: "loc", code: "0362" }, { kind: "loc", code: "0361" }, { kind: "loc", code: "0360" }, { kind: "loc", code: "0359" }, { kind: "loc", code: "0358" }, { kind: "loc", code: "0357" }, { kind: "loc", code: "0356" }, { kind: "loc", code: "0355" }, { kind: "loc", code: "0354" }, { kind: "loc", code: "0353" }, { kind: "loc", code: "0352" }, { kind: "loc", code: "0351" }] },
  { line: 4, left: [{ kind: "loc", code: "0439" }, { kind: "loc", code: "0438" }, { kind: "loc", code: "0437" }, { kind: "loc", code: "0436" }, { kind: "loc", code: "0435" }, { kind: "loc", code: "0434" }, { kind: "loc", code: "0433" }, { kind: "loc", code: "0432" }, { kind: "loc", code: "0431" }, { kind: "loc", code: "0430" }, { kind: "loc", code: "0429" }, { kind: "loc", code: "0428" }, { kind: "loc", code: "0427" }, { kind: "loc", code: "0426" }, { kind: "loc", code: "0425" }, { kind: "loc", code: "0424" }, { kind: "loc", code: "0423" }, { kind: "loc", code: "0422" }, { kind: "loc", code: "0421" }, { kind: "loc", code: "0420" }, { kind: "loc", code: "0419" }, { kind: "loc", code: "0418" }, { kind: "loc", code: "0417" }, { kind: "loc", code: "0416" }, { kind: "loc", code: "0415" }, { kind: "loc", code: "0414" }, { kind: "loc", code: "0413" }, { kind: "loc", code: "0412" }, { kind: "loc", code: "0411" }, { kind: "loc", code: "0410" }, { kind: "loc", code: "0409" }, { kind: "loc", code: "0408" }, { kind: "loc", code: "0407" }, { kind: "loc", code: "0406" }, { kind: "loc", code: "0405" }, { kind: "loc", code: "0404" }, { kind: "loc", code: "0403" }, { kind: "loc", code: "0402" }, { kind: "loc", code: "0401" }], right: [{ kind: "loc", code: "0489" }, { kind: "loc", code: "0488" }, { kind: "loc", code: "0487" }, { kind: "loc", code: "0486" }, { kind: "loc", code: "0485" }, { kind: "loc", code: "0484" }, { kind: "loc", code: "0483" }, { kind: "loc", code: "0482" }, { kind: "loc", code: "0481" }, { kind: "loc", code: "0480" }, { kind: "loc", code: "0479" }, { kind: "loc", code: "0478" }, { kind: "loc", code: "0477" }, { kind: "loc", code: "0476" }, { kind: "loc", code: "0475" }, { kind: "loc", code: "0474" }, { kind: "loc", code: "0473" }, { kind: "loc", code: "0472" }, { kind: "loc", code: "0471" }, { kind: "loc", code: "0470" }, { kind: "loc", code: "0469" }, { kind: "loc", code: "0468" }, { kind: "loc", code: "0467" }, { kind: "loc", code: "0466" }, { kind: "loc", code: "0465" }, { kind: "loc", code: "0464" }, { kind: "loc", code: "0463" }, { kind: "loc", code: "0462" }, { kind: "loc", code: "0461" }, { kind: "loc", code: "0460" }, { kind: "loc", code: "0459" }, { kind: "loc", code: "0458" }, { kind: "loc", code: "0457" }, { kind: "loc", code: "0456" }, { kind: "loc", code: "0455" }, { kind: "loc", code: "0454" }, { kind: "loc", code: "0453" }, { kind: "loc", code: "0452" }, { kind: "loc", code: "0451" }] },
  { line: 5, left: [{ kind: "loc", code: "0539" }, { kind: "loc", code: "0538" }, { kind: "loc", code: "0537" }, { kind: "loc", code: "0536" }, { kind: "loc", code: "0535" }, { kind: "loc", code: "0534" }, { kind: "loc", code: "0533" }, { kind: "loc", code: "0532" }, { kind: "loc", code: "0531" }, { kind: "loc", code: "0530" }, { kind: "loc", code: "0529" }, { kind: "loc", code: "0528" }, { kind: "loc", code: "0527" }, { kind: "loc", code: "0526" }, { kind: "loc", code: "0525" }, { kind: "loc", code: "0524" }, { kind: "loc", code: "0523" }, { kind: "loc", code: "0522" }, { kind: "loc", code: "0521" }, { kind: "loc", code: "0520" }, { kind: "loc", code: "0519" }, { kind: "loc", code: "0518" }, { kind: "loc", code: "0517" }, { kind: "loc", code: "0516" }, { kind: "loc", code: "0515" }, { kind: "loc", code: "0514" }, { kind: "loc", code: "0513" }, { kind: "loc", code: "0512" }, { kind: "loc", code: "0511" }, { kind: "loc", code: "0510" }, { kind: "loc", code: "0509" }, { kind: "loc", code: "0508" }, { kind: "loc", code: "0507" }, { kind: "loc", code: "0506" }, { kind: "loc", code: "0505" }, { kind: "loc", code: "0504" }, { kind: "loc", code: "0503" }, { kind: "loc", code: "0502" }, { kind: "loc", code: "0501" }], right: [{ kind: "loc", code: "0589" }, { kind: "loc", code: "0588" }, { kind: "loc", code: "0587" }, { kind: "loc", code: "0586" }, { kind: "loc", code: "0585" }, { kind: "loc", code: "0584" }, { kind: "loc", code: "0583" }, { kind: "loc", code: "0582" }, { kind: "loc", code: "0581" }, { kind: "loc", code: "0580" }, { kind: "loc", code: "0579" }, { kind: "loc", code: "0578" }, { kind: "loc", code: "0577" }, { kind: "loc", code: "0576" }, { kind: "loc", code: "0575" }, { kind: "loc", code: "0574" }, { kind: "loc", code: "0573" }, { kind: "loc", code: "0572" }, { kind: "loc", code: "0571" }, { kind: "loc", code: "0570" }, { kind: "loc", code: "0569" }, { kind: "loc", code: "0568" }, { kind: "loc", code: "0567" }, { kind: "loc", code: "0566" }, { kind: "loc", code: "0565" }, { kind: "loc", code: "0564" }, { kind: "loc", code: "0563" }, { kind: "loc", code: "0562" }, { kind: "loc", code: "0561" }, { kind: "loc", code: "0560" }, { kind: "loc", code: "0559" }, { kind: "loc", code: "0558" }, { kind: "loc", code: "0557" }, { kind: "loc", code: "0556" }, { kind: "loc", code: "0555" }, { kind: "loc", code: "0554" }, { kind: "loc", code: "0553" }, { kind: "loc", code: "0552" }, { kind: "loc", code: "0551" }] },
  { line: 6, left: [{ kind: "loc", code: "0639" }, { kind: "loc", code: "0638" }, { kind: "loc", code: "0637" }, { kind: "loc", code: "0636" }, { kind: "loc", code: "0635" }, { kind: "loc", code: "0634" }, { kind: "loc", code: "0633" }, { kind: "loc", code: "0632" }, { kind: "loc", code: "0631" }, { kind: "loc", code: "0630" }, { kind: "loc", code: "0629" }, { kind: "loc", code: "0628" }, { kind: "loc", code: "0627" }, { kind: "loc", code: "0626" }, { kind: "loc", code: "0625" }, { kind: "loc", code: "0624" }, { kind: "loc", code: "0623" }, { kind: "loc", code: "0622" }, { kind: "loc", code: "0621" }, { kind: "loc", code: "0620" }, { kind: "loc", code: "0619" }, { kind: "loc", code: "0618" }, { kind: "loc", code: "0617" }, { kind: "loc", code: "0616" }, { kind: "loc", code: "0615" }, { kind: "loc", code: "0614" }, { kind: "loc", code: "0613" }, { kind: "loc", code: "0612" }, { kind: "loc", code: "0611" }, { kind: "loc", code: "0610" }, { kind: "loc", code: "0609" }, { kind: "loc", code: "0608" }, { kind: "loc", code: "0607" }, { kind: "loc", code: "0606" }, { kind: "loc", code: "0605" }, { kind: "loc", code: "0604" }, { kind: "loc", code: "0603" }, { kind: "loc", code: "0602" }, { kind: "loc", code: "0601" }], right: [{ kind: "loc", code: "0689" }, { kind: "loc", code: "0688" }, { kind: "loc", code: "0687" }, { kind: "loc", code: "0686" }, { kind: "loc", code: "0685" }, { kind: "loc", code: "0684" }, { kind: "loc", code: "0683" }, { kind: "loc", code: "0682" }, { kind: "loc", code: "0681" }, { kind: "loc", code: "0680" }, { kind: "loc", code: "0679" }, { kind: "loc", code: "0678" }, { kind: "loc", code: "0677" }, { kind: "loc", code: "0676" }, { kind: "loc", code: "0675" }, { kind: "loc", code: "0674" }, { kind: "loc", code: "0673" }, { kind: "loc", code: "0672" }, { kind: "loc", code: "0671" }, { kind: "loc", code: "0670" }, { kind: "loc", code: "0669" }, { kind: "loc", code: "0668" }, { kind: "loc", code: "0667" }, { kind: "loc", code: "0666" }, { kind: "loc", code: "0665" }, { kind: "loc", code: "0664" }, { kind: "loc", code: "0663" }, { kind: "loc", code: "0662" }, { kind: "loc", code: "0661" }, { kind: "loc", code: "0660" }, { kind: "loc", code: "0659" }, { kind: "loc", code: "0658" }, { kind: "loc", code: "0657" }, { kind: "loc", code: "0656" }, { kind: "loc", code: "0655" }, { kind: "loc", code: "0654" }, { kind: "loc", code: "0653" }, { kind: "loc", code: "0652" }, { kind: "loc", code: "0651" }] },
  { line: 7, left: [{ kind: "loc", code: "0739" }, { kind: "loc", code: "0738" }, { kind: "loc", code: "0737" }, { kind: "loc", code: "0736" }, { kind: "loc", code: "0735" }, { kind: "loc", code: "0734" }, { kind: "loc", code: "0733" }, { kind: "loc", code: "0732" }, { kind: "loc", code: "0731" }, { kind: "loc", code: "0730" }, { kind: "loc", code: "0729" }, { kind: "loc", code: "0728" }, { kind: "loc", code: "0727" }, { kind: "loc", code: "0726" }, { kind: "loc", code: "0725" }, { kind: "loc", code: "0724" }, { kind: "loc", code: "0723" }, { kind: "loc", code: "0722" }, { kind: "loc", code: "0721" }, { kind: "loc", code: "0720" }, { kind: "loc", code: "0719" }, { kind: "loc", code: "0718" }, { kind: "loc", code: "0717" }, { kind: "loc", code: "0716" }, { kind: "loc", code: "0715" }, { kind: "loc", code: "0714" }, { kind: "loc", code: "0713" }, { kind: "loc", code: "0712" }, { kind: "loc", code: "0711" }, { kind: "loc", code: "0710" }, { kind: "loc", code: "0709" }, { kind: "loc", code: "0708" }, { kind: "loc", code: "0707" }, { kind: "loc", code: "0706" }, { kind: "loc", code: "0705" }, { kind: "loc", code: "0704" }, { kind: "loc", code: "0703" }, { kind: "loc", code: "0702" }, { kind: "loc", code: "0701" }], right: [{ kind: "loc", code: "0789" }, { kind: "loc", code: "0788" }, { kind: "loc", code: "0787" }, { kind: "loc", code: "0786" }, { kind: "loc", code: "0785" }, { kind: "loc", code: "0784" }, { kind: "loc", code: "0783" }, { kind: "loc", code: "0782" }, { kind: "loc", code: "0781" }, { kind: "loc", code: "0780" }, { kind: "loc", code: "0779" }, { kind: "loc", code: "0778" }, { kind: "loc", code: "0777" }, { kind: "loc", code: "0776" }, { kind: "loc", code: "0775" }, { kind: "loc", code: "0774" }, { kind: "loc", code: "0773" }, { kind: "loc", code: "0772" }, { kind: "loc", code: "0771" }, { kind: "loc", code: "0770" }, { kind: "loc", code: "0769" }, { kind: "loc", code: "0768" }, { kind: "loc", code: "0767" }, { kind: "loc", code: "0766" }, { kind: "loc", code: "0765" }, { kind: "loc", code: "0764" }, { kind: "loc", code: "0763" }, { kind: "loc", code: "0762" }, { kind: "loc", code: "0761" }, { kind: "loc", code: "0760" }, { kind: "loc", code: "0759" }, { kind: "loc", code: "0758" }, { kind: "loc", code: "0757" }, { kind: "loc", code: "0756" }, { kind: "loc", code: "0755" }, { kind: "loc", code: "0754" }, { kind: "loc", code: "0753" }, { kind: "loc", code: "0752" }, { kind: "loc", code: "0751" }] },
  { line: 8, left: [{ kind: "loc", code: "0839" }, { kind: "loc", code: "0838" }, { kind: "loc", code: "0837" }, { kind: "loc", code: "0836" }, { kind: "loc", code: "0835" }, { kind: "loc", code: "0834" }, { kind: "loc", code: "0833" }, { kind: "loc", code: "0832" }, { kind: "loc", code: "0831" }, { kind: "loc", code: "0830" }, { kind: "loc", code: "0829" }, { kind: "loc", code: "0828" }, { kind: "loc", code: "0827" }, { kind: "loc", code: "0826" }, { kind: "loc", code: "0825" }, { kind: "loc", code: "0824" }, { kind: "loc", code: "0823" }, { kind: "loc", code: "0822" }, { kind: "loc", code: "0821" }, { kind: "loc", code: "0820" }, { kind: "loc", code: "0819" }, { kind: "loc", code: "0818" }, { kind: "loc", code: "0817" }, { kind: "loc", code: "0816" }, { kind: "loc", code: "0815" }, { kind: "loc", code: "0814" }, { kind: "loc", code: "0813" }, { kind: "loc", code: "0812" }, { kind: "loc", code: "0811" }, { kind: "loc", code: "0810" }, { kind: "loc", code: "0809" }, { kind: "loc", code: "0808" }, { kind: "loc", code: "0807" }, { kind: "loc", code: "0806" }, { kind: "loc", code: "0805" }, { kind: "loc", code: "0804" }, { kind: "loc", code: "0803" }, { kind: "loc", code: "0802" }, { kind: "loc", code: "0801" }], right: [{ kind: "blank" }, { kind: "blank" }, { kind: "blank" }, { kind: "blank" }, { kind: "blank" }, { kind: "blank" }, { kind: "blank" }, { kind: "blank" }, { kind: "blank" }, { kind: "blank" }, { kind: "blank" }, { kind: "blank" }, { kind: "blank" }, { kind: "loc", code: "0876" }, { kind: "loc", code: "0875" }, { kind: "loc", code: "0874" }, { kind: "loc", code: "0873" }, { kind: "loc", code: "0872" }, { kind: "loc", code: "0871" }, { kind: "loc", code: "0870" }, { kind: "loc", code: "0869" }, { kind: "loc", code: "0868" }, { kind: "loc", code: "0867" }, { kind: "loc", code: "0866" }, { kind: "loc", code: "0865" }, { kind: "loc", code: "0864" }, { kind: "loc", code: "0863" }, { kind: "loc", code: "0862" }, { kind: "loc", code: "0861" }, { kind: "loc", code: "0860" }, { kind: "loc", code: "0859" }, { kind: "loc", code: "0858" }, { kind: "loc", code: "0857" }, { kind: "loc", code: "0856" }, { kind: "loc", code: "0855" }, { kind: "loc", code: "0854" }, { kind: "loc", code: "0853" }, { kind: "loc", code: "0852" }, { kind: "loc", code: "0851" }] }
];

export const CENTER_3_LAYOUT: LineLayout[] = [
  { line: 1, left: [{ kind: "loc", code: "0139" }, { kind: "loc", code: "0138" }, { kind: "loc", code: "0137" }, { kind: "loc", code: "0136" }, { kind: "loc", code: "0135" }, { kind: "loc", code: "0134" }, { kind: "loc", code: "0133" }, { kind: "loc", code: "0132" }, { kind: "loc", code: "0131" }, { kind: "loc", code: "0130" }, { kind: "loc", code: "0129" }, { kind: "loc", code: "0128" }, { kind: "loc", code: "0127" }, { kind: "loc", code: "0126" }, { kind: "loc", code: "0125" }, { kind: "loc", code: "0124" }, { kind: "loc", code: "0123" }, { kind: "loc", code: "0122" }, { kind: "loc", code: "0121" }, { kind: "loc", code: "0120" }, { kind: "loc", code: "0119" }, { kind: "loc", code: "0118" }, { kind: "loc", code: "0117" }, { kind: "loc", code: "0116" }, { kind: "loc", code: "0115" }, { kind: "loc", code: "0114" }, { kind: "loc", code: "0113" }, { kind: "loc", code: "0112" }, { kind: "loc", code: "0111" }, { kind: "loc", code: "0110" }, { kind: "loc", code: "0109" }, { kind: "loc", code: "0108" }, { kind: "loc", code: "0107" }, { kind: "loc", code: "0106" }, { kind: "loc", code: "0105" }, { kind: "loc", code: "0104" }, { kind: "loc", code: "0103" }, { kind: "loc", code: "0102" }, { kind: "loc", code: "0101" }], right: [{ kind: "loc", code: "0189" }, { kind: "loc", code: "0188" }, { kind: "loc", code: "0187" }, { kind: "loc", code: "0186" }, { kind: "loc", code: "0185" }, { kind: "loc", code: "0184" }, { kind: "loc", code: "0183" }, { kind: "loc", code: "0182" }, { kind: "loc", code: "0181" }, { kind: "loc", code: "0180" }, { kind: "loc", code: "0179" }, { kind: "loc", code: "0178" }, { kind: "loc", code: "0177" }, { kind: "loc", code: "0176" }, { kind: "loc", code: "0175" }, { kind: "loc", code: "0174" }, { kind: "loc", code: "0173" }, { kind: "loc", code: "0172" }, { kind: "loc", code: "0171" }, { kind: "loc", code: "0170" }, { kind: "loc", code: "0169" }, { kind: "loc", code: "0168" }, { kind: "loc", code: "0167" }, { kind: "loc", code: "0166" }, { kind: "loc", code: "0165" }, { kind: "loc", code: "0164" }, { kind: "loc", code: "0163" }, { kind: "loc", code: "0162" }, { kind: "loc", code: "0161" }, { kind: "loc", code: "0160" }, { kind: "loc", code: "0159" }, { kind: "loc", code: "0158" }, { kind: "loc", code: "0157" }, { kind: "loc", code: "0156" }, { kind: "loc", code: "0155" }, { kind: "loc", code: "0154" }, { kind: "loc", code: "0153" }, { kind: "loc", code: "0152" }, { kind: "loc", code: "0151" }] },
  { line: 2, left: [{ kind: "loc", code: "0239" }, { kind: "loc", code: "0238" }, { kind: "loc", code: "0237" }, { kind: "loc", code: "0236" }, { kind: "loc", code: "0235" }, { kind: "loc", code: "0234" }, { kind: "loc", code: "0233" }, { kind: "loc", code: "0232" }, { kind: "loc", code: "0231" }, { kind: "loc", code: "0230" }, { kind: "loc", code: "0229" }, { kind: "loc", code: "0228" }, { kind: "loc", code: "0227" }, { kind: "loc", code: "0226" }, { kind: "loc", code: "0225" }, { kind: "loc", code: "0224" }, { kind: "loc", code: "0223" }, { kind: "loc", code: "0222" }, { kind: "loc", code: "0221" }, { kind: "loc", code: "0220" }, { kind: "loc", code: "0219" }, { kind: "loc", code: "0218" }, { kind: "loc", code: "0217" }, { kind: "loc", code: "0216" }, { kind: "loc", code: "0215" }, { kind: "loc", code: "0214" }, { kind: "loc", code: "0213" }, { kind: "loc", code: "0212" }, { kind: "loc", code: "0211" }, { kind: "loc", code: "0210" }, { kind: "loc", code: "0209" }, { kind: "loc", code: "0208" }, { kind: "loc", code: "0207" }, { kind: "loc", code: "0206" }, { kind: "loc", code: "0205" }, { kind: "loc", code: "0204" }, { kind: "loc", code: "0203" }, { kind: "loc", code: "0202" }, { kind: "loc", code: "0201" }], right: [{ kind: "loc", code: "0287" }, { kind: "loc", code: "0286" }, { kind: "loc", code: "0285" }, { kind: "loc", code: "0284" }, { kind: "loc", code: "0283" }, { kind: "loc", code: "0282" }, { kind: "loc", code: "0281" }, { kind: "loc", code: "0280" }, { kind: "loc", code: "0279" }, { kind: "loc", code: "0278" }, { kind: "loc", code: "0277" }, { kind: "loc", code: "0276" }, { kind: "loc", code: "0275" }, { kind: "loc", code: "0274" }, { kind: "loc", code: "0273" }, { kind: "loc", code: "0272" }, { kind: "loc", code: "0271" }, { kind: "loc", code: "0270" }, { kind: "loc", code: "0269" }, { kind: "loc", code: "0268" }, { kind: "loc", code: "0267" }, { kind: "loc", code: "0266" }, { kind: "loc", code: "0265" }, { kind: "loc", code: "0264" }, { kind: "loc", code: "0263" }, { kind: "loc", code: "0262" }, { kind: "pillar", span: 2 }, { kind: "loc", code: "0261" }, { kind: "loc", code: "0260" }, { kind: "loc", code: "0259" }, { kind: "loc", code: "0258" }, { kind: "loc", code: "0257" }, { kind: "loc", code: "0256" }, { kind: "loc", code: "0255" }, { kind: "loc", code: "0254" }, { kind: "loc", code: "0253" }, { kind: "loc", code: "0252" }, { kind: "loc", code: "0251" }] },
  { line: 3, left: [{ kind: "loc", code: "0339" }, { kind: "loc", code: "0338" }, { kind: "loc", code: "0337" }, { kind: "loc", code: "0336" }, { kind: "loc", code: "0335" }, { kind: "loc", code: "0334" }, { kind: "loc", code: "0333" }, { kind: "loc", code: "0332" }, { kind: "loc", code: "0331" }, { kind: "loc", code: "0330" }, { kind: "loc", code: "0329" }, { kind: "loc", code: "0328" }, { kind: "loc", code: "0327" }, { kind: "loc", code: "0326" }, { kind: "loc", code: "0325" }, { kind: "loc", code: "0324" }, { kind: "loc", code: "0323" }, { kind: "loc", code: "0322" }, { kind: "loc", code: "0321" }, { kind: "loc", code: "0320" }, { kind: "loc", code: "0319" }, { kind: "loc", code: "0318" }, { kind: "loc", code: "0317" }, { kind: "loc", code: "0316" }, { kind: "loc", code: "0315" }, { kind: "loc", code: "0314" }, { kind: "loc", code: "0313" }, { kind: "loc", code: "0312" }, { kind: "loc", code: "0311" }, { kind: "loc", code: "0310" }, { kind: "loc", code: "0309" }, { kind: "loc", code: "0308" }, { kind: "loc", code: "0307" }, { kind: "loc", code: "0306" }, { kind: "loc", code: "0305" }, { kind: "loc", code: "0304" }, { kind: "loc", code: "0303" }, { kind: "loc", code: "0302" }, { kind: "loc", code: "0301" }], right: [{ kind: "loc", code: "0389" }, { kind: "loc", code: "0388" }, { kind: "loc", code: "0387" }, { kind: "loc", code: "0386" }, { kind: "loc", code: "0385" }, { kind: "loc", code: "0384" }, { kind: "loc", code: "0383" }, { kind: "loc", code: "0382" }, { kind: "loc", code: "0381" }, { kind: "loc", code: "0380" }, { kind: "loc", code: "0379" }, { kind: "loc", code: "0378" }, { kind: "loc", code: "0377" }, { kind: "loc", code: "0376" }, { kind: "loc", code: "0375" }, { kind: "loc", code: "0374" }, { kind: "loc", code: "0373" }, { kind: "loc", code: "0372" }, { kind: "loc", code: "0371" }, { kind: "loc", code: "0370" }, { kind: "loc", code: "0369" }, { kind: "loc", code: "0368" }, { kind: "loc", code: "0367" }, { kind: "loc", code: "0366" }, { kind: "loc", code: "0365" }, { kind: "loc", code: "0364" }, { kind: "loc", code: "0363" }, { kind: "loc", code: "0362" }, { kind: "loc", code: "0361" }, { kind: "loc", code: "0360" }, { kind: "loc", code: "0359" }, { kind: "loc", code: "0358" }, { kind: "loc", code: "0357" }, { kind: "loc", code: "0356" }, { kind: "loc", code: "0355" }, { kind: "loc", code: "0354" }, { kind: "loc", code: "0353" }, { kind: "loc", code: "0352" }, { kind: "loc", code: "0351" }] },
  { line: 4, left: [{ kind: "loc", code: "0439" }, { kind: "loc", code: "0438" }, { kind: "loc", code: "0437" }, { kind: "loc", code: "0436" }, { kind: "loc", code: "0435" }, { kind: "loc", code: "0434" }, { kind: "loc", code: "0433" }, { kind: "loc", code: "0432" }, { kind: "loc", code: "0431" }, { kind: "loc", code: "0430" }, { kind: "loc", code: "0429" }, { kind: "loc", code: "0428" }, { kind: "loc", code: "0427" }, { kind: "loc", code: "0426" }, { kind: "loc", code: "0425" }, { kind: "loc", code: "0424" }, { kind: "loc", code: "0423" }, { kind: "loc", code: "0422" }, { kind: "loc", code: "0421" }, { kind: "loc", code: "0420" }, { kind: "loc", code: "0419" }, { kind: "loc", code: "0418" }, { kind: "loc", code: "0417" }, { kind: "loc", code: "0416" }, { kind: "loc", code: "0415" }, { kind: "loc", code: "0414" }, { kind: "loc", code: "0413" }, { kind: "loc", code: "0412" }, { kind: "loc", code: "0411" }, { kind: "loc", code: "0410" }, { kind: "loc", code: "0409" }, { kind: "loc", code: "0408" }, { kind: "loc", code: "0407" }, { kind: "loc", code: "0406" }, { kind: "loc", code: "0405" }, { kind: "loc", code: "0404" }, { kind: "loc", code: "0403" }, { kind: "loc", code: "0402" }, { kind: "loc", code: "0401" }], right: [{ kind: "loc", code: "0489" }, { kind: "loc", code: "0488" }, { kind: "loc", code: "0487" }, { kind: "loc", code: "0486" }, { kind: "loc", code: "0485" }, { kind: "loc", code: "0484" }, { kind: "loc", code: "0483" }, { kind: "loc", code: "0482" }, { kind: "loc", code: "0481" }, { kind: "loc", code: "0480" }, { kind: "loc", code: "0479" }, { kind: "loc", code: "0478" }, { kind: "loc", code: "0477" }, { kind: "loc", code: "0476" }, { kind: "loc", code: "0475" }, { kind: "loc", code: "0474" }, { kind: "loc", code: "0473" }, { kind: "loc", code: "0472" }, { kind: "loc", code: "0471" }, { kind: "loc", code: "0470" }, { kind: "loc", code: "0469" }, { kind: "loc", code: "0468" }, { kind: "loc", code: "0467" }, { kind: "loc", code: "0466" }, { kind: "loc", code: "0465" }, { kind: "loc", code: "0464" }, { kind: "loc", code: "0463" }, { kind: "loc", code: "0462" }, { kind: "loc", code: "0461" }, { kind: "loc", code: "0460" }, { kind: "loc", code: "0459" }, { kind: "loc", code: "0458" }, { kind: "loc", code: "0457" }, { kind: "loc", code: "0456" }, { kind: "loc", code: "0455" }, { kind: "loc", code: "0454" }, { kind: "loc", code: "0453" }, { kind: "loc", code: "0452" }, { kind: "loc", code: "0451" }] }
];

function locSpan(from: number, to: number): LocSlot[] {
  const high = Math.max(from, to);
  const low = Math.min(from, to);
  const slots: LocSlot[] = [];
  for (let n = high; n >= low; n -= 1) slots.push({ kind: "loc", code: String(n).padStart(4, "0") });
  return slots;
}

function pocheonLine(line: number, leftFrom: number, leftTo: number, rightFrom: number, rightTo: number, spanTo = 0): LineLayout {
  const left = locSpan(leftFrom, leftTo);
  const right = locSpan(rightFrom, rightTo);
  const span = Math.max(left.length, right.length, spanTo);
  const pad = (slots: LocSlot[]) => [...Array.from({ length: span - slots.length }, (): LocSlot => ({ kind: "blank" })), ...slots];
  return { line, left: pad(left), right: pad(right) };
}

export const POCHEON_1_LAYOUT: LineLayout[] = [
  pocheonLine(1, 101, 152, 201, 252),
  pocheonLine(2, 301, 352, 401, 452),
  pocheonLine(3, 501, 552, 601, 652),
  pocheonLine(4, 701, 752, 801, 852),
  pocheonLine(5, 901, 952, 1001, 1052),
  pocheonLine(6, 1101, 1152, 1201, 1252),
];

export const POCHEON_2_LAYOUT: LineLayout[] = [
  pocheonLine(1, 101, 152, 201, 252),
  pocheonLine(2, 301, 352, 401, 452),
  pocheonLine(3, 501, 552, 601, 652),
  pocheonLine(4, 701, 752, 801, 839),
  pocheonLine(5, 901, 939, 1001, 1039, 52),
  pocheonLine(6, 1101, 1139, 1201, 1239, 52),
];

function genericLine(line: number): LineLayout {
  const base = line * 100;
  return { line, left: locSpan(base + 39, base + 1), right: locSpan(base + 89, base + 51) };
}

function builtin(site: string, center: string): LineLayout[] {
  const base = site === "포천"
    ? center === "2센터" ? POCHEON_2_LAYOUT : POCHEON_1_LAYOUT
    : site === "신오산" && center === "3센터" ? CENTER_3_LAYOUT : CENTER_12_LAYOUT;
  const want = Math.max(1, Math.min(12, linesOf(site, center)));
  if (want === base.length) return base;
  if (want < base.length) return base.slice(0, want);
  const more = base.slice();
  for (let line = base.length + 1; line <= want; line += 1) {
    more.push(site === "포천"
      ? pocheonLine(line, (line - 1) * 200 + 101, (line - 1) * 200 + 152, (line - 1) * 200 + 201, (line - 1) * 200 + 252)
      : genericLine(line));
  }
  return more;
}

function fitSide(slots: LocSlot[], target: number): LocSlot[] {
  if (slots.length === target) return slots;
  if (slots.length > target) return slots.slice(slots.length - target);
  return [...Array.from({ length: target - slots.length }, (): LocSlot => ({ kind: "blank" })), ...slots];
}

function extendLine(site: string, prev: LineLayout[], line: number): LineLayout {
  const seed = site === "포천"
    ? pocheonLine(line, (line - 1) * 200 + 101, (line - 1) * 200 + 152, (line - 1) * 200 + 201, (line - 1) * 200 + 252)
    : genericLine(line);
  const last = prev[prev.length - 1];
  if (!last) return seed;
  return { line, left: fitSide(seed.left, last.left.length), right: fitSide(seed.right, last.right.length) };
}

const layoutKey = (site: string, center: string) => `${site}\t${center}`;

function tokenOf(slot: LocSlot) {
  if (slot.kind === "blank") return "-";
  if (slot.kind === "pillar") return "기둥";
  return slot.code;
}

function slotOf(token: string): LocSlot | null {
  const text = token.trim().slice(0, 12);
  if (!text) return null;
  if (text === "-" || text === "." || text === "빈칸") return { kind: "blank" };
  if (text === "기둥" || text === "*" || text.toLowerCase() === "pillar") return { kind: "pillar" };
  return { kind: "loc", code: text };
}

export function sideText(slots: LocSlot[]) {
  return slots.map(tokenOf).join(" ");
}

export function textToSlots(text: string): LocSlot[] {
  const slots = text.split(/[\s,，]+/).map(slotOf).filter((slot): slot is LocSlot => slot != null).slice(0, 80);
  return slots.length > 0 ? slots : [{ kind: "blank" }];
}

function decodeToken(token: string): LocSlot {
  if (token === "-" || token === "." || token === "빈칸") return { kind: "blank" };
  if (token === "기둥" || token === "*" || token.toLowerCase() === "pillar") return { kind: "pillar" };
  return { kind: "loc", code: token.slice(0, 12) };
}

function decodeSide(list: string[] | undefined): LocSlot[] {
  const slots = (list ?? []).slice(0, 80).map((item) => decodeToken(String(item ?? "")));
  return slots.length > 0 ? slots : [{ kind: "blank" }];
}

function decodeLine(line: PanelLayoutLine): LineLayout {
  return { line: line.line, left: decodeSide(line.left), right: decodeSide(line.right) };
}

function cleanLayouts(raw: unknown) {
  const next: Record<string, PanelLayoutLine[]> = {};
  if (!raw || typeof raw !== "object") return next;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const [site, center] = key.split("\t");
    if (!site || !/^([1-9]센터)$/.test(center ?? "")) continue;
    if (!Array.isArray(value)) continue;
    const lines: PanelLayoutLine[] = [];
    for (const item of value.slice(0, 12)) {
      if (!item || typeof item !== "object") continue;
      const row = item as PanelLayoutLine;
      const line = Math.round(Number(row.line));
      if (!line || line < 1 || line > 12) continue;
      lines.push({
        line,
        left: decodeSide(Array.isArray(row.left) ? row.left.map((item) => String(item ?? "")) : []).map(tokenOf),
        right: decodeSide(Array.isArray(row.right) ? row.right.map((item) => String(item ?? "")) : []).map(tokenOf),
      });
    }
    if (lines.length > 0) next[key] = lines;
  }
  return next;
}

let layouts = cleanLayouts(readPanel().layouts);
const layoutListeners = new Set<() => void>();

function emitLayouts() {
  layoutListeners.forEach((listener) => listener());
}

export function subscribeLayouts(listener: () => void) {
  layoutListeners.add(listener);
  return () => layoutListeners.delete(listener);
}

function storedLines(site: string, center: string): LineLayout[] | null {
  const rows = layouts[layoutKey(site, center)];
  if (!rows?.length) return null;
  return rows.map(decodeLine);
}

function sized(site: string, center: string, base: LineLayout[]) {
  const want = Math.max(1, Math.min(12, linesOf(site, center)));
  if (want === base.length) return base;
  if (want < base.length) return base.slice(0, want);
  const more = base.slice();
  for (let line = base.length + 1; line <= want; line += 1) more.push(extendLine(site, more, line));
  return more;
}

export function layoutForSite(site: string, center: string) {
  const custom = storedLines(site, center);
  if (custom) return sized(site, center, custom);
  return builtin(site, center);
}

export function drawnSlots(slots: LocSlot[]) {
  const drawn: { slot: LocSlot; index: number; span: number }[] = [];
  for (let index = 0; index < slots.length; index += 1) {
    const slot = slots[index];
    if (slot.kind !== "pillar") {
      drawn.push({ slot, index, span: 1 });
      continue;
    }
    const start = index;
    while (index + 1 < slots.length && slots[index + 1]?.kind === "pillar") index += 1;
    drawn.push({ slot: { kind: "pillar" }, index: start, span: index - start + 1 });
  }
  return drawn;
}

export function pillarBox(span: number, big: boolean) {
  const count = Math.max(1, span);
  if (count === 1) return { className: big ? " h-11" : " h-9", style: undefined as { height: string } | undefined };
  const cell = big ? "2.75rem" : "2.25rem";
  return { className: "", style: { height: `calc(${cell} * ${count} + 0.125rem * ${count - 1})` } };
}

export function locRange(fromText: string, toText: string): LocSlot[] | null {
  const from = fromText.trim();
  const to = toText.trim();
  if (!/^\d{1,6}$/.test(from) || !/^\d{1,6}$/.test(to)) return null;
  const start = Number(from);
  const end = Number(to);
  const count = Math.abs(end - start) + 1;
  if (count < 1 || count > 80) return null;
  const width = Math.max(from.length, to.length);
  const step = start <= end ? 1 : -1;
  const slots: LocSlot[] = [];
  for (let n = start; step > 0 ? n <= end : n >= end; n += step) slots.push({ kind: "loc", code: String(n).padStart(width, "0") });
  slots.reverse();
  return slots;
}

export function layoutFor(center: string): LineLayout[] {
  return layoutForSite(shownSite(), center);
}

function remember(site: string, center: string, rows: LineLayout[]) {
  layouts = {
    ...layouts,
    [layoutKey(site, center)]: rows.map((row) => ({
      line: row.line,
      left: row.left.map(tokenOf),
      right: row.right.map(tokenOf),
    })),
  };
  writePanel({ layouts });
  emitLayouts();
}

export function setLayoutSlots(site: string, center: string, line: number, side: "left" | "right", slots: LocSlot[]) {
  const rows = layoutForSite(site, center).map((row) => ({ ...row, left: row.left.slice(), right: row.right.slice() }));
  const index = rows.findIndex((row) => row.line === line);
  if (index < 0) return;
  const next = slots.slice(0, 80).map((slot): LocSlot => (
    slot.kind === "pillar" ? { kind: "pillar" } : slot.kind === "blank" ? { kind: "blank" } : { kind: "loc", code: slot.code.slice(0, 12) }
  ));
  const safe = next.length > 0 ? next : [{ kind: "blank" as const }];
  if (rows[index][side].map(tokenOf).join("\n") === safe.map(tokenOf).join("\n")) return;
  rows[index] = { ...rows[index], [side]: safe };
  remember(site, center, rows);
}

export function addLayoutLine(site: string, center: string) {
  const rows = layoutForSite(site, center);
  if (rows.length >= 12) return;
  setCenterLines(site, center, rows.length + 1);
  remember(site, center, [...rows, extendLine(site, rows, rows.length + 1)]);
}

export function removeLayoutLine(site: string, center: string, line: number) {
  const rows = layoutForSite(site, center);
  if (rows.length <= 1) return;
  const next = rows.filter((row) => row.line !== line).map((row, index) => ({ ...row, line: index + 1 }));
  setCenterLines(site, center, next.length);
  remember(site, center, next);
}

export function resetLayout(site: string, center: string) {
  const key = layoutKey(site, center);
  if (!layouts[key]) return;
  const next = { ...layouts };
  delete next[key];
  layouts = next;
  writePanel({ layouts });
  emitLayouts();
}

onSharedPanel((state) => {
  if (!state.layouts || typeof state.layouts !== "object") return;
  const next = cleanLayouts(state.layouts);
  if (JSON.stringify(next) === JSON.stringify(layouts)) return;
  layouts = next;
  emitLayouts();
});

