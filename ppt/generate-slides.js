const fs = require('fs');
const path = require('path');

const slidesDir = path.join(__dirname, 'slides');

// 通用样式
const baseStyle = `
html { background: #181B24; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  font-family: Arial, sans-serif;
  display: flex;
  background-size: cover;
  background-position: center;
}
h1 { color: #FFFFFF; margin: 0; }
h2 { color: #B165FB; margin: 0; }
h3 { color: #FFFFFF; margin: 0; }
p { color: #E0E0E0; margin: 0; line-height: 1.6; }
ul, ol { color: #E0E0E0; margin: 0; padding-left: 20pt; }
li { margin-bottom: 8pt; line-height: 1.5; }
.highlight { color: #B165FB; }
.accent { color: #40695B; }
.code { font-family: 'Courier New', monospace; background: #0d0f14; padding: 2pt 6pt; border-radius: 3pt; }
`;

// 幻灯片定义
const slides = [
  // === 第一部分：开场 ===
  {
    id: 1,
    type: 'cover',
    content: `
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 40pt;">
        <h1 style="font-size: 36pt; margin-bottom: 20pt;">开源大模型私有化训练方案</h1>
        <h1 style="font-size: 36pt; margin-bottom: 30pt;">深度对比</h1>
        <p style="font-size: 18pt; color: #B165FB; margin-bottom: 40pt;">从 LoRA 到蒸馏的技术选型指南</p>
        <p style="font-size: 14pt; color: #888;">基于 NanoBananaPro 项目实践</p>
      </div>
    `
  },
  {
    id: 2,
    type: 'main',
    content: `
      <div style="flex: 1; padding: 40pt;">
        <h2 style="font-size: 28pt; margin-bottom: 30pt;">问题背景：大模型落地挑战</h2>
        <div style="display: flex; gap: 30pt;">
          <div style="flex: 1;">
            <div style="background: #1e2235; border-left: 4pt solid #B165FB; padding: 20pt; margin-bottom: 20pt; border-radius: 4pt;">
              <h3 style="font-size: 18pt; margin-bottom: 10pt;">资源成本</h3>
              <p style="font-size: 14pt;">7B 模型全量微调需要 60GB+ 显存<br/>训练成本高昂，迭代周期长</p>
            </div>
            <div style="background: #1e2235; border-left: 4pt solid #40695B; padding: 20pt; margin-bottom: 20pt; border-radius: 4pt;">
              <h3 style="font-size: 18pt; margin-bottom: 10pt;">数据隐私</h3>
              <p style="font-size: 14pt;">企业敏感数据不能上传云端<br/>需要本地化部署方案</p>
            </div>
          </div>
          <div style="flex: 1;">
            <div style="background: #1e2235; border-left: 4pt solid #B165FB; padding: 20pt; margin-bottom: 20pt; border-radius: 4pt;">
              <h3 style="font-size: 18pt; margin-bottom: 10pt;">定制需求</h3>
              <p style="font-size: 14pt;">通用模型无法满足垂直领域<br/>需要注入专业知识</p>
            </div>
            <div style="background: #1e2235; border-left: 4pt solid #40695B; padding: 20pt; border-radius: 4pt;">
              <h3 style="font-size: 18pt; margin-bottom: 10pt;">推理延迟</h3>
              <p style="font-size: 14pt;">大模型推理速度慢<br/>实时场景体验差</p>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 3,
    type: 'main',
    content: `
      <div style="flex: 1; padding: 40pt;">
        <h2 style="font-size: 28pt; margin-bottom: 25pt;">六种私有化训练方案概览</h2>
        <div style="display: flex; gap: 15pt; flex-wrap: wrap;">
          <div style="background: #2d1f4a; padding: 15pt 20pt; border-radius: 8pt; width: 200pt;">
            <h3 style="font-size: 16pt; color: #B165FB; margin-bottom: 8pt;">1. 微调 Fine-tuning</h3>
            <p style="font-size: 12pt;">全量微调 / LoRA / PEFT<br/>改动模型参数</p>
          </div>
          <div style="background: #1f3d3d; padding: 15pt 20pt; border-radius: 8pt; width: 200pt;">
            <h3 style="font-size: 16pt; color: #40695B; margin-bottom: 8pt;">2. 指令微调 IFT</h3>
            <p style="font-size: 12pt;">instruction → output<br/>让模型懂任务</p>
          </div>
          <div style="background: #2d1f4a; padding: 15pt 20pt; border-radius: 8pt; width: 200pt;">
            <h3 style="font-size: 16pt; color: #B165FB; margin-bottom: 8pt;">3. SFT + RLHF</h3>
            <p style="font-size: 12pt;">监督微调 + 强化学习<br/>高质量输出</p>
          </div>
          <div style="background: #1f3d3d; padding: 15pt 20pt; border-radius: 8pt; width: 200pt;">
            <h3 style="font-size: 16pt; color: #40695B; margin-bottom: 8pt;">4. Prompt Tuning</h3>
            <p style="font-size: 12pt;">只改输入 embedding<br/>低成本方案</p>
          </div>
          <div style="background: #2d1f4a; padding: 15pt 20pt; border-radius: 8pt; width: 200pt;">
            <h3 style="font-size: 16pt; color: #B165FB; margin-bottom: 8pt;">5. RAG 检索增强</h3>
            <p style="font-size: 12pt;">外部知识库检索<br/>无需训练</p>
          </div>
          <div style="background: #1f3d3d; padding: 15pt 20pt; border-radius: 8pt; width: 200pt;">
            <h3 style="font-size: 16pt; color: #40695B; margin-bottom: 8pt;">6. 混合方案</h3>
            <p style="font-size: 12pt;">RAG + LoRA 等<br/>组合优势</p>
          </div>
        </div>
      </div>
    `
  },
  
  // === 第二部分：微调方案详解 ===
  {
    id: 4,
    type: 'section',
    content: `
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <p style="font-size: 18pt; color: #B165FB; margin-bottom: 15pt;">PART 01</p>
        <h1 style="font-size: 42pt;">微调 Fine-tuning</h1>
        <p style="font-size: 16pt; color: #888; margin-top: 20pt;">全量微调 / LoRA / PEFT</p>
      </div>
    `
  },
  {
    id: 5,
    type: 'main',
    content: `
      <div style="flex: 1; padding: 40pt;">
        <h2 style="font-size: 28pt; margin-bottom: 25pt;">全量微调 Full Fine-tuning</h2>
        <div style="display: flex; gap: 30pt;">
          <div style="flex: 1;">
            <h3 style="font-size: 18pt; color: #B165FB; margin-bottom: 15pt;">原理</h3>
            <p style="font-size: 14pt; margin-bottom: 20pt;">在预训练模型基础上，使用私有数据对<span class="highlight">所有参数</span>进行训练更新。</p>
            <div style="background: #0d0f14; padding: 15pt; border-radius: 4pt; margin-bottom: 20pt;">
              <p style="font-family: 'Courier New', monospace; font-size: 13pt; color: #B165FB;">θ' = θ - η∇L(θ)</p>
              <p style="font-size: 12pt; color: #888; margin-top: 8pt;">更新全部 θ 参数</p>
            </div>
          </div>
          <div style="flex: 1;">
            <div style="background: #1e2235; padding: 20pt; border-radius: 8pt; margin-bottom: 15pt;">
              <h3 style="font-size: 16pt; color: #40695B; margin-bottom: 10pt;">✓ 优点</h3>
              <ul style="font-size: 13pt;">
                <li>能力上限最高</li>
                <li>对数据适应性最好</li>
                <li>效果最接近从头训练</li>
              </ul>
            </div>
            <div style="background: #1e2235; padding: 20pt; border-radius: 8pt;">
              <h3 style="font-size: 16pt; color: #B165FB; margin-bottom: 10pt;">✗ 缺点</h3>
              <ul style="font-size: 13pt;">
                <li>7B 模型需 60GB+ 显存</li>
                <li>训练时间长、成本高</li>
                <li>每个任务需存储完整模型</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 6,
    type: 'main',
    content: `
      <div style="flex: 1; padding: 40pt;">
        <h2 style="font-size: 28pt; margin-bottom: 25pt;">LoRA 核心思想</h2>
        <div style="display: flex; gap: 30pt;">
          <div style="flex: 1;">
            <h3 style="font-size: 18pt; color: #B165FB; margin-bottom: 15pt;">低秩假设 Low-Rank Hypothesis</h3>
            <p style="font-size: 14pt; margin-bottom: 15pt;">模型适应新任务时，权重的变化 ΔW 具有<span class="highlight">低秩结构</span>。</p>
            <p style="font-size: 14pt; margin-bottom: 20pt;">因此可以将 ΔW 分解为两个小矩阵的乘积：</p>
            <div style="background: #0d0f14; padding: 20pt; border-radius: 4pt; text-align: center;">
              <p style="font-family: 'Courier New', monospace; font-size: 18pt; color: #B165FB;">ΔW = B × A</p>
              <p style="font-size: 12pt; color: #888; margin-top: 10pt;">B ∈ R^(d×r), A ∈ R^(r×k), r << min(d,k)</p>
            </div>
          </div>
          <div style="flex: 1;">
            <div style="background: #1e2235; padding: 25pt; border-radius: 8pt;">
              <h3 style="font-size: 16pt; color: #40695B; margin-bottom: 15pt;">关键洞察</h3>
              <ul style="font-size: 13pt;">
                <li style="margin-bottom: 12pt;"><span class="highlight">冻结</span>原始预训练权重 W</li>
                <li style="margin-bottom: 12pt;">只训练低秩矩阵 <span class="highlight">B</span> 和 <span class="highlight">A</span></li>
                <li style="margin-bottom: 12pt;">推理时可合并：W' = W + BA</li>
                <li>无额外推理延迟</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 7,
    type: 'main',
    content: `
      <div style="flex: 1; padding: 40pt;">
        <h2 style="font-size: 28pt; margin-bottom: 25pt;">LoRA 数学原理</h2>
        <div style="display: flex; gap: 30pt;">
          <div style="flex: 1.2;">
            <div style="background: #0d0f14; padding: 20pt; border-radius: 4pt; margin-bottom: 20pt;">
              <p style="font-family: 'Courier New', monospace; font-size: 16pt; color: #FFFFFF; margin-bottom: 10pt;">原始权重: W ∈ R^(d×k)</p>
              <p style="font-family: 'Courier New', monospace; font-size: 16pt; color: #B165FB; margin-bottom: 10pt;">LoRA:     W' = W + (α/r) × B × A</p>
              <p style="font-family: 'Courier New', monospace; font-size: 14pt; color: #888;">其中 B ∈ R^(d×r), A ∈ R^(r×k)</p>
            </div>
            <h3 style="font-size: 16pt; color: #B165FB; margin-bottom: 12pt;">参数效率计算</h3>
            <p style="font-size: 13pt; margin-bottom: 8pt;">原始参数量: <span class="code">d × k</span></p>
            <p style="font-size: 13pt; margin-bottom: 8pt;">LoRA 参数量: <span class="code">(d + k) × r</span></p>
            <p style="font-size: 13pt;">当 r << min(d,k) 时，参数量大幅减少</p>
          </div>
          <div style="flex: 0.8;">
            <div style="background: #1e2235; padding: 20pt; border-radius: 8pt;">
              <h3 style="font-size: 16pt; color: #40695B; margin-bottom: 15pt;">实例计算</h3>
              <p style="font-size: 13pt; margin-bottom: 8pt;">d = k = 4096</p>
              <p style="font-size: 13pt; margin-bottom: 8pt;">r = 16</p>
              <p style="font-size: 13pt; margin-bottom: 15pt; color: #888;">────────────</p>
              <p style="font-size: 13pt; margin-bottom: 8pt;">原始: 16,777,216</p>
              <p style="font-size: 13pt; margin-bottom: 8pt;">LoRA: 131,072</p>
              <p style="font-size: 14pt; color: #B165FB; margin-top: 15pt;">节省 99.2% 参数!</p>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 8,
    type: 'main',
    content: `
      <div style="flex: 1; padding: 40pt;">
        <h2 style="font-size: 28pt; margin-bottom: 25pt;">LoRA 训练流程</h2>
        <div style="display: flex; gap: 20pt;">
          <div style="flex: 1; background: #1e2235; padding: 20pt; border-radius: 8pt;">
            <h3 style="font-size: 16pt; color: #B165FB; margin-bottom: 15pt;">1. 前向传播</h3>
            <div style="background: #0d0f14; padding: 12pt; border-radius: 4pt; margin-bottom: 12pt;">
              <p style="font-family: 'Courier New', monospace; font-size: 12pt; color: #B165FB;">h = Wx + BAx</p>
            </div>
            <p style="font-size: 12pt;">原始权重 W 冻结<br/>LoRA 分支 BA 并联输出</p>
          </div>
          <div style="flex: 1; background: #1e2235; padding: 20pt; border-radius: 8pt;">
            <h3 style="font-size: 16pt; color: #40695B; margin-bottom: 15pt;">2. 反向传播</h3>
            <div style="background: #0d0f14; padding: 12pt; border-radius: 4pt; margin-bottom: 12pt;">
              <p style="font-family: 'Courier New', monospace; font-size: 12pt; color: #40695B;">∂L/∂A, ∂L/∂B</p>
            </div>
            <p style="font-size: 12pt;">只计算 A、B 的梯度<br/>W 的梯度不计算</p>
          </div>
          <div style="flex: 1; background: #1e2235; padding: 20pt; border-radius: 8pt;">
            <h3 style="font-size: 16pt; color: #B165FB; margin-bottom: 15pt;">3. 推理合并</h3>
            <div style="background: #0d0f14; padding: 12pt; border-radius: 4pt; margin-bottom: 12pt;">
              <p style="font-family: 'Courier New', monospace; font-size: 12pt; color: #B165FB;">W' = W + BA</p>
            </div>
            <p style="font-size: 12pt;">训练完成后合并权重<br/>无额外推理开销</p>
          </div>
        </div>
        <div style="margin-top: 25pt; text-align: center;">
          <p style="font-size: 14pt; color: #888;">训练时: 两条路径 → 推理时: 单一权重矩阵</p>
        </div>
      </div>
    `
  },
  {
    id: 9,
    type: 'main',
    content: `
      <div style="flex: 1; padding: 40pt;">
        <h2 style="font-size: 28pt; margin-bottom: 25pt;">LoRA 关键超参数</h2>
        <div style="display: flex; gap: 20pt;">
          <div style="flex: 1;">
            <div style="background: #1e2235; padding: 18pt; border-radius: 8pt; margin-bottom: 15pt;">
              <h3 style="font-size: 16pt; color: #B165FB; margin-bottom: 10pt;">rank (r)</h3>
              <p style="font-size: 13pt; margin-bottom: 8pt;">低秩维度，控制表达能力</p>
              <p style="font-size: 12pt; color: #888;">推荐值: 8 / 16 / 32 / 64</p>
              <p style="font-size: 12pt; color: #40695B; margin-top: 8pt;">r 越大 → 能力越强 → 参数越多</p>
            </div>
            <div style="background: #1e2235; padding: 18pt; border-radius: 8pt;">
              <h3 style="font-size: 16pt; color: #B165FB; margin-bottom: 10pt;">alpha (α)</h3>
              <p style="font-size: 13pt; margin-bottom: 8pt;">缩放因子，控制 LoRA 输出权重</p>
              <p style="font-size: 12pt; color: #888;">推荐值: 通常设为 2 × r</p>
              <p style="font-size: 12pt; color: #40695B; margin-top: 8pt;">实际缩放 = α / r</p>
            </div>
          </div>
          <div style="flex: 1;">
            <div style="background: #1e2235; padding: 18pt; border-radius: 8pt; margin-bottom: 15pt;">
              <h3 style="font-size: 16pt; color: #40695B; margin-bottom: 10pt;">dropout</h3>
              <p style="font-size: 13pt; margin-bottom: 8pt;">防止过拟合的正则化</p>
              <p style="font-size: 12pt; color: #888;">推荐值: 0.05 ~ 0.1</p>
              <p style="font-size: 12pt; color: #B165FB; margin-top: 8pt;">小数据集时适当增大</p>
            </div>
            <div style="background: #1e2235; padding: 18pt; border-radius: 8pt;">
              <h3 style="font-size: 16pt; color: #40695B; margin-bottom: 10pt;">target_modules</h3>
              <p style="font-size: 13pt; margin-bottom: 8pt;">应用 LoRA 的目标层</p>
              <p style="font-size: 11pt; color: #888;">q_proj, k_proj, v_proj, o_proj<br/>gate_proj, up_proj, down_proj</p>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 10,
    type: 'main',
    content: `
      <div style="flex: 1; padding: 40pt;">
        <h2 style="font-size: 28pt; margin-bottom: 25pt;">PEFT 方法族</h2>
        <div style="display: flex; gap: 20pt;">
          <div style="flex: 1; background: #2d1f4a; padding: 18pt; border-radius: 8pt;">
            <h3 style="font-size: 16pt; color: #B165FB; margin-bottom: 12pt;">LoRA</h3>
            <p style="font-size: 12pt; margin-bottom: 8pt;">低秩矩阵分解</p>
            <p style="font-size: 11pt; color: #888;">通用性最好，推荐首选</p>
          </div>
          <div style="flex: 1; background: #1f3d3d; padding: 18pt; border-radius: 8pt;">
            <h3 style="font-size: 16pt; color: #40695B; margin-bottom: 12pt;">QLoRA</h3>
            <p style="font-size: 12pt; margin-bottom: 8pt;">4-bit NF4 量化 + LoRA</p>
            <p style="font-size: 11pt; color: #888;">显存占用最低</p>
          </div>
          <div style="flex: 1; background: #2d1f4a; padding: 18pt; border-radius: 8pt;">
            <h3 style="font-size: 16pt; color: #B165FB; margin-bottom: 12pt;">Adapter</h3>
            <p style="font-size: 12pt; margin-bottom: 8pt;">层间插入适配器模块</p>
            <p style="font-size: 11pt; color: #888;">有额外推理开销</p>
          </div>
          <div style="flex: 1; background: #1f3d3d; padding: 18pt; border-radius: 8pt;">
            <h3 style="font-size: 16pt; color: #40695B; margin-bottom: 12pt;">IA³</h3>
            <p style="font-size: 12pt; margin-bottom: 8pt;">学习激活值缩放向量</p>
            <p style="font-size: 11pt; color: #888;">参数最少，适合少样本</p>
          </div>
        </div>
        <div style="margin-top: 25pt; background: #0d0f14; padding: 15pt; border-radius: 4pt;">
          <p style="font-size: 14pt; text-align: center;"><span class="highlight">QLoRA</span> = 4-bit 量化基座 + LoRA 适配器 + 双重量化 + 分页优化器</p>
          <p style="font-size: 13pt; text-align: center; color: #888; margin-top: 8pt;">24GB 显存可微调 65B 模型</p>
        </div>
      </div>
    `
  },
  {
    id: 11,
    type: 'main',
    content: `
      <div style="flex: 1; padding: 40pt;">
        <h2 style="font-size: 28pt; margin-bottom: 25pt;">微调适用场景</h2>
        <div style="display: flex; gap: 25pt;">
          <div style="flex: 1;">
            <div style="background: #1e2235; border-left: 4pt solid #B165FB; padding: 20pt; margin-bottom: 15pt; border-radius: 4pt;">
              <h3 style="font-size: 16pt; margin-bottom: 10pt;">企业知识库</h3>
              <p style="font-size: 13pt;">内部文档、流程规范<br/>客服问答系统</p>
            </div>
            <div style="background: #1e2235; border-left: 4pt solid #40695B; padding: 20pt; margin-bottom: 15pt; border-radius: 4pt;">
              <h3 style="font-size: 16pt; margin-bottom: 10pt;">垂直领域</h3>
              <p style="font-size: 13pt;">法律、医学、金融<br/>专业术语和知识注入</p>
            </div>
          </div>
          <div style="flex: 1;">
            <div style="background: #1e2235; border-left: 4pt solid #B165FB; padding: 20pt; margin-bottom: 15pt; border-radius: 4pt;">
              <h3 style="font-size: 16pt; margin-bottom: 10pt;">特定任务</h3>
              <p style="font-size: 13pt;">代码生成、文本分类<br/>信息抽取、摘要生成</p>
            </div>
            <div style="background: #1e2235; border-left: 4pt solid #40695B; padding: 20pt; border-radius: 4pt;">
              <h3 style="font-size: 16pt; margin-bottom: 10pt;">风格定制</h3>
              <p style="font-size: 13pt;">品牌语气、写作风格<br/>特定人设对话</p>
            </div>
          </div>
        </div>
        <div style="margin-top: 20pt; text-align: center;">
          <p style="font-size: 14pt; color: #B165FB;">数据量中等（1K-100K）+ 需要深度定制 → 选择微调</p>
        </div>
      </div>
    `
  },
  
  // === 第三部分：其他五种方案 ===
  {
    id: 12,
    type: 'section',
    content: `
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <p style="font-size: 18pt; color: #B165FB; margin-bottom: 15pt;">PART 02</p>
        <h1 style="font-size: 42pt;">指令微调</h1>
        <h1 style="font-size: 42pt;">Instruction Tuning</h1>
      </div>
    `
  },
  {
    id: 13,
    type: 'main',
    content: `
      <div style="flex: 1; padding: 40pt;">
        <h2 style="font-size: 28pt; margin-bottom: 25pt;">指令微调原理</h2>
        <div style="display: flex; gap: 30pt;">
          <div style="flex: 1;">
            <h3 style="font-size: 18pt; color: #B165FB; margin-bottom: 15pt;">核心思想</h3>
            <p style="font-size: 14pt; margin-bottom: 15pt;">在大模型上加入"指令数据集"，使模型更擅长<span class="highlight">遵循指令</span>完成任务。</p>
            <div style="background: #0d0f14; padding: 15pt; border-radius: 4pt; margin-bottom: 15pt;">
              <p style="font-size: 12pt; color: #888; margin-bottom: 8pt;">数据格式:</p>
              <p style="font-family: 'Courier New', monospace; font-size: 12pt; color: #B165FB;">instruction → output</p>
            </div>
            <p style="font-size: 14pt;">通常结合 <span class="highlight">LoRA</span> 或 <span class="highlight">PEFT</span> 实现。</p>
          </div>
          <div style="flex: 1;">
            <div style="background: #1e2235; padding: 20pt; border-radius: 8pt; margin-bottom: 15pt;">
              <h3 style="font-size: 14pt; color: #40695B; margin-bottom: 10pt;">示例数据</h3>
              <p style="font-size: 12pt; color: #888; margin-bottom: 5pt;">Instruction:</p>
              <p style="font-size: 12pt; margin-bottom: 10pt;">"将以下文本翻译成英文"</p>
              <p style="font-size: 12pt; color: #888; margin-bottom: 5pt;">Output:</p>
              <p style="font-size: 12pt;">"Please translate the following..."</p>
            </div>
            <div style="background: #1e2235; padding: 15pt; border-radius: 8pt;">
              <h3 style="font-size: 14pt; color: #B165FB; margin-bottom: 10pt;">优势</h3>
              <ul style="font-size: 12pt;">
                <li>数据量不必太大</li>
                <li>快速让模型"懂任务"</li>
                <li>通用能力保持较好</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 14,
    type: 'section',
    content: `
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <p style="font-size: 18pt; color: #B165FB; margin-bottom: 15pt;">PART 03</p>
        <h1 style="font-size: 42pt;">SFT + RLHF</h1>
        <p style="font-size: 16pt; color: #888; margin-top: 20pt;">监督微调 + 强化学习</p>
      </div>
    `
  },
  {
    id: 15,
    type: 'main',
    content: `
      <div style="flex: 1; padding: 40pt;">
        <h2 style="font-size: 28pt; margin-bottom: 25pt;">SFT 监督微调</h2>
        <div style="display: flex; gap: 30pt;">
          <div style="flex: 1;">
            <h3 style="font-size: 18pt; color: #B165FB; margin-bottom: 15pt;">原理</h3>
            <p style="font-size: 14pt; margin-bottom: 15pt;">使用<span class="highlight">人工标注</span>的高质量数据进行监督学习。</p>
            <div style="background: #0d0f14; padding: 15pt; border-radius: 4pt;">
              <p style="font-size: 13pt; margin-bottom: 8pt;">训练目标:</p>
              <p style="font-family: 'Courier New', monospace; font-size: 13pt; color: #B165FB;">max P(y|x, θ)</p>
              <p style="font-size: 12pt; color: #888; margin-top: 8pt;">最大化正确输出的概率</p>
            </div>
          </div>
          <div style="flex: 1;">
            <div style="background: #1e2235; padding: 20pt; border-radius: 8pt; margin-bottom: 15pt;">
              <h3 style="font-size: 14pt; color: #40695B; margin-bottom: 12pt;">数据要求</h3>
              <ul style="font-size: 13pt;">
                <li>高质量问答对</li>
                <li>人工编写或筛选</li>
                <li>覆盖目标任务场景</li>
              </ul>
            </div>
            <div style="background: #1e2235; padding: 20pt; border-radius: 8pt;">
              <h3 style="font-size: 14pt; color: #B165FB; margin-bottom: 12pt;">特点</h3>
              <ul style="font-size: 13pt;">
                <li>效果直接、可控</li>
                <li>数据质量 > 数据量</li>
                <li>是 RLHF 的前置步骤</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 16,
    type: 'main',
    content: `
      <div style="flex: 1; padding: 40pt;">
        <h2 style="font-size: 28pt; margin-bottom: 25pt;">RLHF 强化学习</h2>
        <div style="margin-bottom: 20pt;">
          <p style="font-size: 14pt;">通过<span class="highlight">人类反馈</span>训练奖励模型，再用强化学习优化生成策略。</p>
        </div>
        <div style="display: flex; gap: 15pt;">
          <div style="flex: 1; background: #2d1f4a; padding: 18pt; border-radius: 8pt;">
            <h3 style="font-size: 15pt; color: #B165FB; margin-bottom: 12pt;">Step 1: SFT</h3>
            <p style="font-size: 12pt;">监督微调<br/>得到初始策略模型</p>
          </div>
          <div style="flex: 1; background: #1f3d3d; padding: 18pt; border-radius: 8pt;">
            <h3 style="font-size: 15pt; color: #40695B; margin-bottom: 12pt;">Step 2: RM</h3>
            <p style="font-size: 12pt;">训练奖励模型<br/>学习人类偏好排序</p>
          </div>
          <div style="flex: 1; background: #2d1f4a; padding: 18pt; border-radius: 8pt;">
            <h3 style="font-size: 15pt; color: #B165FB; margin-bottom: 12pt;">Step 3: PPO</h3>
            <p style="font-size: 12pt;">强化学习优化<br/>最大化奖励得分</p>
          </div>
        </div>
        <div style="margin-top: 20pt; display: flex; gap: 20pt;">
          <div style="flex: 1; background: #1e2235; padding: 15pt; border-radius: 8pt;">
            <h3 style="font-size: 14pt; color: #40695B; margin-bottom: 8pt;">✓ 优势</h3>
            <p style="font-size: 12pt;">输出质量高、安全性好、符合人类期望</p>
          </div>
          <div style="flex: 1; background: #1e2235; padding: 15pt; border-radius: 8pt;">
            <h3 style="font-size: 14pt; color: #B165FB; margin-bottom: 8pt;">✗ 挑战</h3>
            <p style="font-size: 12pt;">训练复杂、资源消耗大、需要人类标注</p>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 17,
    type: 'section',
    content: `
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <p style="font-size: 18pt; color: #B165FB; margin-bottom: 15pt;">PART 04</p>
        <h1 style="font-size: 42pt;">Prompt Tuning</h1>
        <p style="font-size: 16pt; color: #888; margin-top: 20pt;">前缀 / 提示调优</p>
      </div>
    `
  },
  {
    id: 18,
    type: 'main',
    content: `
      <div style="flex: 1; padding: 40pt;">
        <h2 style="font-size: 28pt; margin-bottom: 25pt;">Prompt Tuning 原理</h2>
        <div style="display: flex; gap: 30pt;">
          <div style="flex: 1;">
            <h3 style="font-size: 18pt; color: #B165FB; margin-bottom: 15pt;">核心思想</h3>
            <p style="font-size: 14pt; margin-bottom: 15pt;"><span class="highlight">不改模型参数</span>，只在输入前添加可学习的"软提示"向量。</p>
            <div style="background: #0d0f14; padding: 15pt; border-radius: 4pt; margin-bottom: 15pt;">
              <p style="font-family: 'Courier New', monospace; font-size: 13pt; color: #B165FB;">[P₁, P₂, ..., Pₙ] + [x₁, x₂, ...]</p>
              <p style="font-size: 12pt; color: #888; margin-top: 8pt;">软提示 + 原始输入</p>
            </div>
            <p style="font-size: 14pt;">只训练 P 向量，模型权重完全冻结。</p>
          </div>
          <div style="flex: 1;">
            <div style="background: #1e2235; padding: 20pt; border-radius: 8pt; margin-bottom: 15pt;">
              <h3 style="font-size: 14pt; color: #40695B; margin-bottom: 12pt;">✓ 优势</h3>
              <ul style="font-size: 13pt;">
                <li>训练量极小</li>
                <li>显存占用最低</li>
                <li>多任务可共享模型</li>
              </ul>
            </div>
            <div style="background: #1e2235; padding: 20pt; border-radius: 8pt;">
              <h3 style="font-size: 14pt; color: #B165FB; margin-bottom: 12pt;">✗ 局限</h3>
              <ul style="font-size: 13pt;">
                <li>灵活性较差</li>
                <li>只适合固定任务</li>
                <li>效果上限有限</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 19,
    type: 'section',
    content: `
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <p style="font-size: 18pt; color: #B165FB; margin-bottom: 15pt;">PART 05</p>
        <h1 style="font-size: 42pt;">RAG</h1>
        <h1 style="font-size: 36pt;">检索增强生成</h1>
      </div>
    `
  },
  {
    id: 20,
    type: 'main',
    content: `
      <div style="flex: 1; padding: 40pt;">
        <h2 style="font-size: 28pt; margin-bottom: 25pt;">RAG 原理</h2>
        <div style="display: flex; gap: 30pt;">
          <div style="flex: 1;">
            <h3 style="font-size: 18pt; color: #B165FB; margin-bottom: 15pt;">核心思想</h3>
            <p style="font-size: 14pt; margin-bottom: 15pt;">模型权重<span class="highlight">保持不动</span>，将外部知识库作为检索源，动态补充上下文。</p>
            <div style="background: #0d0f14; padding: 15pt; border-radius: 4pt;">
              <p style="font-size: 13pt; margin-bottom: 8pt;">输入 = Query + 检索结果</p>
              <p style="font-family: 'Courier New', monospace; font-size: 12pt; color: #B165FB;">LLM(query, context) → answer</p>
            </div>
          </div>
          <div style="flex: 1;">
            <div style="background: #1e2235; padding: 18pt; border-radius: 8pt; margin-bottom: 12pt;">
              <h3 style="font-size: 14pt; color: #40695B; margin-bottom: 10pt;">✓ 优势</h3>
              <ul style="font-size: 12pt;">
                <li>无需训练</li>
                <li>知识可实时更新</li>
                <li>隐私数据不出本地</li>
                <li>可追溯来源</li>
              </ul>
            </div>
            <div style="background: #1e2235; padding: 18pt; border-radius: 8pt;">
              <h3 style="font-size: 14pt; color: #B165FB; margin-bottom: 10pt;">✗ 局限</h3>
              <ul style="font-size: 12pt;">
                <li>依赖检索质量</li>
                <li>上下文长度受限</li>
                <li>可能信息不连贯</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 21,
    type: 'main',
    content: `
      <div style="flex: 1; padding: 40pt;">
        <h2 style="font-size: 28pt; margin-bottom: 25pt;">RAG 架构流程</h2>
        <div style="display: flex; gap: 15pt; margin-bottom: 25pt;">
          <div style="flex: 1; background: #2d1f4a; padding: 20pt; border-radius: 8pt; text-align: center;">
            <h3 style="font-size: 16pt; color: #B165FB; margin-bottom: 10pt;">1. 用户查询</h3>
            <p style="font-size: 13pt;">Query</p>
          </div>
          <div style="flex: 1; background: #1f3d3d; padding: 20pt; border-radius: 8pt; text-align: center;">
            <h3 style="font-size: 16pt; color: #40695B; margin-bottom: 10pt;">2. 向量检索</h3>
            <p style="font-size: 13pt;">Embedding → Search</p>
          </div>
          <div style="flex: 1; background: #2d1f4a; padding: 20pt; border-radius: 8pt; text-align: center;">
            <h3 style="font-size: 16pt; color: #B165FB; margin-bottom: 10pt;">3. 上下文拼接</h3>
            <p style="font-size: 13pt;">Query + Documents</p>
          </div>
          <div style="flex: 1; background: #1f3d3d; padding: 20pt; border-radius: 8pt; text-align: center;">
            <h3 style="font-size: 16pt; color: #40695B; margin-bottom: 10pt;">4. LLM 生成</h3>
            <p style="font-size: 13pt;">Answer</p>
          </div>
        </div>
        <div style="background: #1e2235; padding: 20pt; border-radius: 8pt;">
          <h3 style="font-size: 16pt; color: #B165FB; margin-bottom: 12pt;">适用场景</h3>
          <div style="display: flex; gap: 30pt;">
            <ul style="font-size: 13pt; flex: 1;">
              <li>企业知识库问答</li>
              <li>内部文档助手</li>
            </ul>
            <ul style="font-size: 13pt; flex: 1;">
              <li>客服系统</li>
              <li>法规/政策查询</li>
            </ul>
          </div>
        </div>
      </div>
    `
  },
  
  // === 第四部分：方案对比与选择 ===
  {
    id: 22,
    type: 'section',
    content: `
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <p style="font-size: 18pt; color: #B165FB; margin-bottom: 15pt;">PART 06</p>
        <h1 style="font-size: 42pt;">方案对比与选择</h1>
      </div>
    `
  },
  {
    id: 23,
    type: 'main',
    content: `
      <div style="flex: 1; padding: 35pt;">
        <h2 style="font-size: 26pt; margin-bottom: 20pt;">六种方案对比</h2>
        <div id="comparison-table" class="placeholder" style="width: 650pt; height: 280pt; background: #1e2235; border-radius: 8pt;"></div>
      </div>
    `
  },
  {
    id: 24,
    type: 'main',
    content: `
      <div style="flex: 1; padding: 40pt;">
        <h2 style="font-size: 28pt; margin-bottom: 25pt;">混合方案</h2>
        <div style="display: flex; gap: 20pt;">
          <div style="flex: 1; background: #2d1f4a; padding: 20pt; border-radius: 8pt;">
            <h3 style="font-size: 16pt; color: #B165FB; margin-bottom: 12pt;">RAG + LoRA</h3>
            <p style="font-size: 13pt; margin-bottom: 10pt;">先用 LoRA 注入领域知识<br/>再用 RAG 接入实时知识库</p>
            <p style="font-size: 12pt; color: #888;">适合：需要专业理解 + 实时信息</p>
          </div>
          <div style="flex: 1; background: #1f3d3d; padding: 20pt; border-radius: 8pt;">
            <h3 style="font-size: 16pt; color: #40695B; margin-bottom: 12pt;">LoRA + 量化</h3>
            <p style="font-size: 13pt; margin-bottom: 10pt;">QLoRA: 4-bit 量化基座<br/>+ LoRA 微调适配器</p>
            <p style="font-size: 12pt; color: #888;">适合：资源受限环境</p>
          </div>
          <div style="flex: 1; background: #2d1f4a; padding: 20pt; border-radius: 8pt;">
            <h3 style="font-size: 16pt; color: #B165FB; margin-bottom: 12pt;">SFT + RAG</h3>
            <p style="font-size: 13pt; margin-bottom: 10pt;">指令微调提升任务能力<br/>RAG 补充外部知识</p>
            <p style="font-size: 12pt; color: #888;">适合：对话型助手</p>
          </div>
        </div>
        <div style="margin-top: 25pt; background: #0d0f14; padding: 15pt; border-radius: 4pt; text-align: center;">
          <p style="font-size: 14pt;"><span class="highlight">组合使用</span> 往往比单一方案效果更好</p>
        </div>
      </div>
    `
  },
  {
    id: 25,
    type: 'main',
    content: `
      <div style="flex: 1; padding: 40pt;">
        <h2 style="font-size: 28pt; margin-bottom: 25pt;">方案选择决策树</h2>
        <div style="display: flex; gap: 20pt;">
          <div style="flex: 1;">
            <div style="background: #1e2235; padding: 18pt; border-radius: 8pt; margin-bottom: 15pt;">
              <h3 style="font-size: 14pt; color: #B165FB; margin-bottom: 10pt;">数据量大 + 预算充足?</h3>
              <p style="font-size: 13pt;">→ <span class="highlight">SFT + LoRA</span> 或全量微调</p>
            </div>
            <div style="background: #1e2235; padding: 18pt; border-radius: 8pt; margin-bottom: 15pt;">
              <h3 style="font-size: 14pt; color: #40695B; margin-bottom: 10pt;">数据量小 + 快速上线?</h3>
              <p style="font-size: 13pt;">→ <span class="highlight">RAG</span> + 指令微调/LoRA</p>
            </div>
            <div style="background: #1e2235; padding: 18pt; border-radius: 8pt;">
              <h3 style="font-size: 14pt; color: #B165FB; margin-bottom: 10pt;">显存受限?</h3>
              <p style="font-size: 13pt;">→ <span class="highlight">QLoRA</span> 或 Prompt Tuning</p>
            </div>
          </div>
          <div style="flex: 1;">
            <div style="background: #1e2235; padding: 18pt; border-radius: 8pt; margin-bottom: 15pt;">
              <h3 style="font-size: 14pt; color: #40695B; margin-bottom: 10pt;">知识需要实时更新?</h3>
              <p style="font-size: 13pt;">→ <span class="highlight">RAG</span> 为主</p>
            </div>
            <div style="background: #1e2235; padding: 18pt; border-radius: 8pt; margin-bottom: 15pt;">
              <h3 style="font-size: 14pt; color: #B165FB; margin-bottom: 10pt;">需要高质量输出?</h3>
              <p style="font-size: 13pt;">→ <span class="highlight">RLHF</span></p>
            </div>
            <div style="background: #1e2235; padding: 18pt; border-radius: 8pt;">
              <h3 style="font-size: 14pt; color: #40695B; margin-bottom: 10pt;">多任务切换?</h3>
              <p style="font-size: 13pt;">→ <span class="highlight">LoRA</span> 多适配器</p>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 26,
    type: 'main',
    content: `
      <div style="flex: 1; padding: 40pt;">
        <h2 style="font-size: 28pt; margin-bottom: 25pt;">典型场景推荐</h2>
        <div style="display: flex; gap: 20pt;">
          <div style="flex: 1; background: #1e2235; border-top: 4pt solid #B165FB; padding: 20pt; border-radius: 0 0 8pt 8pt;">
            <h3 style="font-size: 16pt; margin-bottom: 12pt;">消费级 GPU</h3>
            <p style="font-size: 13pt; margin-bottom: 10pt;">24GB 显存以下</p>
            <p style="font-size: 14pt; color: #B165FB;">推荐: QLoRA</p>
            <p style="font-size: 12pt; color: #888; margin-top: 8pt;">4-bit 量化 + LoRA<br/>可微调 7B-13B 模型</p>
          </div>
          <div style="flex: 1; background: #1e2235; border-top: 4pt solid #40695B; padding: 20pt; border-radius: 0 0 8pt 8pt;">
            <h3 style="font-size: 16pt; margin-bottom: 12pt;">企业知识库</h3>
            <p style="font-size: 13pt; margin-bottom: 10pt;">大量内部文档</p>
            <p style="font-size: 14pt; color: #40695B;">推荐: RAG + LoRA</p>
            <p style="font-size: 12pt; color: #888; margin-top: 8pt;">RAG 接入文档<br/>LoRA 优化理解能力</p>
          </div>
          <div style="flex: 1; background: #1e2235; border-top: 4pt solid #B165FB; padding: 20pt; border-radius: 0 0 8pt 8pt;">
            <h3 style="font-size: 16pt; margin-bottom: 12pt;">对话型产品</h3>
            <p style="font-size: 13pt; margin-bottom: 10pt;">面向用户的 AI 助手</p>
            <p style="font-size: 14pt; color: #B165FB;">推荐: SFT + RLHF</p>
            <p style="font-size: 12pt; color: #888; margin-top: 8pt;">高质量输出<br/>符合人类期望</p>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 27,
    type: 'main',
    content: `
      <div style="flex: 1; padding: 40pt;">
        <h2 style="font-size: 28pt; margin-bottom: 25pt;">隐私安全考量</h2>
        <div style="display: flex; gap: 30pt;">
          <div style="flex: 1;">
            <div style="background: #1e2235; border-left: 4pt solid #40695B; padding: 20pt; border-radius: 4pt; margin-bottom: 20pt;">
              <h3 style="font-size: 16pt; color: #40695B; margin-bottom: 12pt;">✓ 推荐方案</h3>
              <ul style="font-size: 13pt;">
                <li style="margin-bottom: 8pt;"><span class="highlight">RAG + 本地向量库</span><br/><span style="color: #888; font-size: 12pt;">数据不出本地</span></li>
                <li style="margin-bottom: 8pt;"><span class="highlight">私有模型 + LoRA</span><br/><span style="color: #888; font-size: 12pt;">本地训练，无需上传</span></li>
                <li><span class="highlight">Ollama 本地部署</span><br/><span style="color: #888; font-size: 12pt;">完全离线运行</span></li>
              </ul>
            </div>
          </div>
          <div style="flex: 1;">
            <div style="background: #1e2235; border-left: 4pt solid #B165FB; padding: 20pt; border-radius: 4pt; margin-bottom: 20pt;">
              <h3 style="font-size: 16pt; color: #B165FB; margin-bottom: 12pt;">✗ 需要注意</h3>
              <ul style="font-size: 13pt;">
                <li style="margin-bottom: 8pt;">云端 API 微调<br/><span style="color: #888; font-size: 12pt;">数据上传风险</span></li>
                <li style="margin-bottom: 8pt;">第三方数据标注<br/><span style="color: #888; font-size: 12pt;">泄露风险</span></li>
                <li>公开模型微调<br/><span style="color: #888; font-size: 12pt;">知识可能被提取</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `
  },
  
  // === 第五部分：项目实践 + 总结 ===
  {
    id: 28,
    type: 'section',
    content: `
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <p style="font-size: 18pt; color: #B165FB; margin-bottom: 15pt;">PART 07</p>
        <h1 style="font-size: 42pt;">NanoBananaPro 实践</h1>
      </div>
    `
  },
  {
    id: 29,
    type: 'main',
    content: `
      <div style="flex: 1; padding: 40pt;">
        <h2 style="font-size: 28pt; margin-bottom: 25pt;">为什么选择 LoRA + 指令微调</h2>
        <div style="display: flex; gap: 30pt;">
          <div style="flex: 1;">
            <h3 style="font-size: 18pt; color: #B165FB; margin-bottom: 15pt;">项目背景</h3>
            <ul style="font-size: 14pt;">
              <li style="margin-bottom: 10pt;">496 条高质量提示词数据</li>
              <li style="margin-bottom: 10pt;">增强后约 1500 条训练样本</li>
              <li style="margin-bottom: 10pt;">Mac M3 Pro 36GB 本地训练</li>
              <li>需要快速迭代验证</li>
            </ul>
          </div>
          <div style="flex: 1;">
            <div style="background: #1e2235; padding: 20pt; border-radius: 8pt;">
              <h3 style="font-size: 16pt; color: #40695B; margin-bottom: 15pt;">方案选择</h3>
              <ul style="font-size: 13pt;">
                <li style="margin-bottom: 10pt;"><span class="highlight">LoRA</span>: 显存友好，30分钟完成训练</li>
                <li style="margin-bottom: 10pt;"><span class="highlight">指令微调</span>: 数据量适中，任务明确</li>
                <li style="margin-bottom: 10pt;"><span class="highlight">Qwen2.5-3B</span>: 中英双语，体积适中</li>
                <li><span class="highlight">Ollama</span>: 本地部署，完全离线</li>
              </ul>
            </div>
          </div>
        </div>
        <div style="margin-top: 20pt; background: #0d0f14; padding: 15pt; border-radius: 4pt;">
          <p style="font-size: 13pt; text-align: center;">训练配置: <span class="code">rank=16, alpha=32, epochs=3, batch_size=2</span></p>
        </div>
      </div>
    `
  },
  {
    id: 30,
    type: 'main',
    content: `
      <div style="flex: 1; padding: 40pt;">
        <h2 style="font-size: 28pt; margin-bottom: 30pt;">总结 Key Takeaways</h2>
        <div style="display: flex; gap: 20pt; margin-bottom: 30pt;">
          <div style="flex: 1; background: #2d1f4a; padding: 20pt; border-radius: 8pt;">
            <p style="font-size: 14pt; text-align: center;"><span style="font-size: 24pt; color: #B165FB;">1</span></p>
            <p style="font-size: 13pt; text-align: center; margin-top: 10pt;">没有"最好"的方案<br/>只有"最适合"的选择</p>
          </div>
          <div style="flex: 1; background: #1f3d3d; padding: 20pt; border-radius: 8pt;">
            <p style="font-size: 14pt; text-align: center;"><span style="font-size: 24pt; color: #40695B;">2</span></p>
            <p style="font-size: 13pt; text-align: center; margin-top: 10pt;">LoRA 是性价比之选<br/>资源受限首选 QLoRA</p>
          </div>
          <div style="flex: 1; background: #2d1f4a; padding: 20pt; border-radius: 8pt;">
            <p style="font-size: 14pt; text-align: center;"><span style="font-size: 24pt; color: #B165FB;">3</span></p>
            <p style="font-size: 13pt; text-align: center; margin-top: 10pt;">RAG 无需训练<br/>知识库场景优先考虑</p>
          </div>
          <div style="flex: 1; background: #1f3d3d; padding: 20pt; border-radius: 8pt;">
            <p style="font-size: 14pt; text-align: center;"><span style="font-size: 24pt; color: #40695B;">4</span></p>
            <p style="font-size: 13pt; text-align: center; margin-top: 10pt;">混合方案往往<br/>效果更好</p>
          </div>
        </div>
        <div style="text-align: center;">
          <h2 style="font-size: 24pt; color: #B165FB; margin-bottom: 15pt;">Q & A</h2>
          <p style="font-size: 14pt; color: #888;">感谢聆听，欢迎讨论</p>
        </div>
      </div>
    `
  }
];

// 生成 HTML 文件
function generateSlide(slide) {
  const bgImage = slide.type === 'cover' ? 'bg-cover.png' : 
                  slide.type === 'section' ? 'bg-section.png' : 'bg-main.png';
  
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
${baseStyle}
</style>
</head>
<body style="background-image: url('../images/${bgImage}');">
${slide.content}
</body>
</html>`;

  const filename = `slide${String(slide.id).padStart(2, '0')}.html`;
  fs.writeFileSync(path.join(slidesDir, filename), html);
  console.log(`Created: ${filename}`);
}

// 生成所有幻灯片
slides.forEach(generateSlide);
console.log(`\nTotal: ${slides.length} slides generated!`);
