const fs = require('fs');
const path = require('path');

const slidesDir = path.join(__dirname, 'slides');

// Ensure slides directory exists
if (!fs.existsSync(slidesDir)) {
  fs.mkdirSync(slidesDir, { recursive: true });
}

// Base CSS with REDUCED padding (30pt instead of 40pt) and safer margins
const baseCSS = `
html { background: #181B24; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  font-family: Arial, sans-serif;
  display: flex;
  background-size: cover;
  background-position: center;
  box-sizing: border-box;
}
h1 { color: #FFFFFF; margin: 0; }
h2 { color: #B165FB; margin: 0; }
h3 { color: #FFFFFF; margin: 0; }
p { color: #E0E0E0; margin: 0; line-height: 1.5; }
ul, ol { color: #E0E0E0; margin: 0; padding-left: 18pt; }
li { margin-bottom: 6pt; line-height: 1.4; }
.highlight { color: #B165FB; }
.accent { color: #40695B; }
`;

function createHTML(bg, content) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
${baseCSS}
</style>
</head>
<body style="background-image: url('../images/${bg}');">
${content}
</body>
</html>`;
}

// Slide definitions with COMPACT layouts (30pt padding, smaller gaps)
const slides = [
  // Slide 1: Cover
  {
    bg: 'bg-cover.png',
    content: `
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 30pt;">
        <h1 style="font-size: 32pt; margin-bottom: 15pt;">开源大模型私有化训练方案</h1>
        <h1 style="font-size: 32pt; margin-bottom: 25pt;">深度对比</h1>
        <p style="font-size: 16pt; color: #B165FB; margin-bottom: 30pt;">从 LoRA 到蒸馏的技术选型指南</p>
        <p style="font-size: 13pt; color: #888;">基于 NanoBananaPro 项目实践</p>
      </div>
    `
  },
  // Slide 2: Agenda
  {
    bg: 'bg-main.png',
    content: `
      <div style="flex: 1; padding: 30pt;">
        <h2 style="font-size: 26pt; margin-bottom: 20pt;">目录</h2>
        <div style="display: flex; gap: 20pt;">
          <div style="flex: 1;">
            <ol style="font-size: 14pt; line-height: 2;">
              <li><span class="highlight">背景与挑战</span></li>
              <li><span class="highlight">六种私有化方案概览</span></li>
              <li><span class="highlight">全量微调</span></li>
              <li><span class="highlight">LoRA 原理深度解析</span></li>
              <li><span class="highlight">PEFT 方法族</span></li>
            </ol>
          </div>
          <div style="flex: 1;">
            <ol start="6" style="font-size: 14pt; line-height: 2;">
              <li><span class="highlight">指令微调与 SFT+RLHF</span></li>
              <li><span class="highlight">Prompt Tuning</span></li>
              <li><span class="highlight">RAG 检索增强</span></li>
              <li><span class="highlight">方案对比与选择</span></li>
              <li><span class="highlight">实践案例</span></li>
            </ol>
          </div>
        </div>
      </div>
    `
  },
  // Slide 3: Background
  {
    bg: 'bg-main.png',
    content: `
      <div style="flex: 1; padding: 30pt;">
        <h2 style="font-size: 26pt; margin-bottom: 20pt;">六种私有化训练方案概览</h2>
        <div style="display: flex; gap: 12pt; flex-wrap: wrap;">
          <div style="background: #2d1f4a; padding: 12pt 15pt; border-radius: 6pt; width: 195pt;">
            <h3 style="font-size: 14pt; color: #B165FB; margin-bottom: 6pt;">1. 微调 Fine-tuning</h3>
            <p style="font-size: 11pt;">全量微调 / LoRA / PEFT</p>
          </div>
          <div style="background: #1f3d3d; padding: 12pt 15pt; border-radius: 6pt; width: 195pt;">
            <h3 style="font-size: 14pt; color: #40695B; margin-bottom: 6pt;">2. 指令微调 IFT</h3>
            <p style="font-size: 11pt;">instruction → output</p>
          </div>
          <div style="background: #2d1f4a; padding: 12pt 15pt; border-radius: 6pt; width: 195pt;">
            <h3 style="font-size: 14pt; color: #B165FB; margin-bottom: 6pt;">3. SFT + RLHF</h3>
            <p style="font-size: 11pt;">监督微调 + 强化学习</p>
          </div>
          <div style="background: #1f3d3d; padding: 12pt 15pt; border-radius: 6pt; width: 195pt;">
            <h3 style="font-size: 14pt; color: #40695B; margin-bottom: 6pt;">4. Prompt Tuning</h3>
            <p style="font-size: 11pt;">只改输入 embedding</p>
          </div>
          <div style="background: #2d1f4a; padding: 12pt 15pt; border-radius: 6pt; width: 195pt;">
            <h3 style="font-size: 14pt; color: #B165FB; margin-bottom: 6pt;">5. RAG 检索增强</h3>
            <p style="font-size: 11pt;">外部知识库检索</p>
          </div>
          <div style="background: #1f3d3d; padding: 12pt 15pt; border-radius: 6pt; width: 195pt;">
            <h3 style="font-size: 14pt; color: #40695B; margin-bottom: 6pt;">6. 混合方案</h3>
            <p style="font-size: 11pt;">RAG + LoRA 组合</p>
          </div>
        </div>
      </div>
    `
  },
  // Slide 4: Section - Full Fine-tuning
  {
    bg: 'bg-section.png',
    content: `
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 30pt;">
        <h1 style="font-size: 28pt; margin-bottom: 15pt;">Part 1</h1>
        <h2 style="font-size: 24pt; color: #FFFFFF;">全量微调 Full Fine-tuning</h2>
      </div>
    `
  },
  // Slide 5: Full Fine-tuning
  {
    bg: 'bg-main.png',
    content: `
      <div style="flex: 1; padding: 30pt;">
        <h2 style="font-size: 24pt; margin-bottom: 18pt;">全量微调 Full Fine-tuning</h2>
        <div style="display: flex; gap: 20pt;">
          <div style="flex: 1;">
            <h3 style="font-size: 15pt; color: #B165FB; margin-bottom: 10pt;">原理</h3>
            <p style="font-size: 13pt; margin-bottom: 15pt;">对预训练模型<span class="highlight">所有参数</span>进行更新</p>
            <div style="background: #0d0f14; padding: 12pt; border-radius: 4pt;">
              <p style="font-family: 'Courier New', monospace; font-size: 14pt; color: #B165FB;">θ' = θ - η∇L(θ)</p>
              <p style="font-size: 11pt; color: #888; margin-top: 6pt;">更新全部 θ 参数</p>
            </div>
          </div>
          <div style="flex: 1;">
            <div style="background: #1e2235; padding: 15pt; border-radius: 6pt; margin-bottom: 12pt;">
              <h3 style="font-size: 14pt; color: #40695B; margin-bottom: 8pt;">优点</h3>
              <ul style="font-size: 12pt;">
                <li>能力上限最高</li>
                <li>对数据适应性最好</li>
              </ul>
            </div>
            <div style="background: #1e2235; padding: 15pt; border-radius: 6pt;">
              <h3 style="font-size: 14pt; color: #B165FB; margin-bottom: 8pt;">缺点</h3>
              <ul style="font-size: 12pt;">
                <li>7B 需 60GB+ 显存</li>
                <li>训练时间长、成本高</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `
  },
  // Slide 6: Full Fine-tuning Details
  {
    bg: 'bg-main.png',
    content: `
      <div style="flex: 1; padding: 30pt;">
        <h2 style="font-size: 24pt; margin-bottom: 18pt;">全量微调显存分析</h2>
        <div style="display: flex; gap: 20pt;">
          <div style="flex: 1;">
            <h3 style="font-size: 15pt; color: #B165FB; margin-bottom: 12pt;">显存占用构成</h3>
            <ul style="font-size: 13pt;">
              <li><span class="highlight">模型参数</span>: 7B × 2B = 14GB</li>
              <li><span class="highlight">梯度</span>: 14GB (同规模)</li>
              <li><span class="highlight">优化器状态</span>: 28GB (Adam)</li>
              <li><span class="accent">激活值</span>: 约 8-16GB</li>
            </ul>
          </div>
          <div style="flex: 1;">
            <div style="background: #0d0f14; padding: 15pt; border-radius: 4pt;">
              <p style="font-size: 14pt; text-align: center; margin-bottom: 10pt;">7B 模型全量微调</p>
              <p style="font-size: 28pt; color: #B165FB; text-align: center; font-weight: bold;">~64GB</p>
              <p style="font-size: 12pt; color: #888; text-align: center; margin-top: 8pt;">需要 A100 80GB 或多卡</p>
            </div>
          </div>
        </div>
      </div>
    `
  },
  // Slide 7: LoRA Section
  {
    bg: 'bg-section.png',
    content: `
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 30pt;">
        <h1 style="font-size: 28pt; margin-bottom: 15pt;">Part 2</h1>
        <h2 style="font-size: 24pt; color: #FFFFFF;">LoRA 原理深度解析</h2>
      </div>
    `
  },
  // Slide 8: LoRA Intro
  {
    bg: 'bg-main.png',
    content: `
      <div style="flex: 1; padding: 30pt;">
        <h2 style="font-size: 24pt; margin-bottom: 18pt;">LoRA: Low-Rank Adaptation</h2>
        <div style="display: flex; gap: 20pt;">
          <div style="flex: 1;">
            <h3 style="font-size: 15pt; color: #B165FB; margin-bottom: 12pt;">核心思想</h3>
            <p style="font-size: 13pt; margin-bottom: 12pt;">权重更新矩阵可分解为两个<span class="highlight">低秩矩阵</span>的乘积</p>
            <div style="background: #0d0f14; padding: 12pt; border-radius: 4pt; margin-bottom: 12pt;">
              <p style="font-family: 'Courier New', monospace; font-size: 16pt; color: #B165FB; text-align: center;">W' = W + BA</p>
            </div>
            <p style="font-size: 12pt; color: #888;">W: d×k 原始权重 (冻结)</p>
            <p style="font-size: 12pt; color: #888;">B: d×r, A: r×k (r << min(d,k))</p>
          </div>
          <div style="flex: 1;">
            <div style="background: #1e2235; padding: 15pt; border-radius: 6pt;">
              <h3 style="font-size: 14pt; color: #40695B; margin-bottom: 10pt;">参数量对比</h3>
              <p style="font-size: 13pt; margin-bottom: 8pt;">全量: d × k = 4096 × 4096</p>
              <p style="font-size: 22pt; color: #888; margin-bottom: 8pt;">= 16.7M 参数</p>
              <p style="font-size: 13pt; margin-bottom: 8pt;">LoRA(r=8): (d+k) × r</p>
              <p style="font-size: 22pt; color: #B165FB;">= 65K 参数 (0.4%)</p>
            </div>
          </div>
        </div>
      </div>
    `
  },
  // Slide 9: LoRA Math
  {
    bg: 'bg-main.png',
    content: `
      <div style="flex: 1; padding: 30pt;">
        <h2 style="font-size: 24pt; margin-bottom: 18pt;">LoRA 数学原理</h2>
        <div style="display: flex; gap: 20pt;">
          <div style="flex: 1;">
            <div style="background: #0d0f14; padding: 15pt; border-radius: 4pt; margin-bottom: 15pt;">
              <p style="font-family: 'Courier New', monospace; font-size: 13pt; color: #B165FB;">h = Wx + BAx</p>
              <p style="font-family: 'Courier New', monospace; font-size: 13pt; color: #B165FB; margin-top: 8pt;">h = Wx + (α/r)BAx</p>
            </div>
            <h3 style="font-size: 14pt; color: #B165FB; margin-bottom: 10pt;">初始化策略</h3>
            <ul style="font-size: 12pt;">
              <li>A: 高斯随机初始化</li>
              <li>B: 零初始化</li>
              <li>确保初始 ΔW = BA = 0</li>
            </ul>
          </div>
          <div style="flex: 1;">
            <h3 style="font-size: 14pt; color: #40695B; margin-bottom: 10pt;">为什么有效?</h3>
            <ul style="font-size: 12pt;">
              <li>预训练模型已有强表征</li>
              <li>任务适配只需<span class="highlight">小调整</span></li>
              <li>权重更新具有低秩特性</li>
              <li>Aghajanyan 2020 实验验证</li>
            </ul>
          </div>
        </div>
      </div>
    `
  },
  // Slide 10: LoRA Hyperparams
  {
    bg: 'bg-main.png',
    content: `
      <div style="flex: 1; padding: 30pt;">
        <h2 style="font-size: 24pt; margin-bottom: 18pt;">LoRA 关键超参数</h2>
        <div style="display: flex; gap: 15pt;">
          <div style="flex: 1; background: #1e2235; padding: 15pt; border-radius: 6pt;">
            <h3 style="font-size: 14pt; color: #B165FB; margin-bottom: 8pt;">rank (r)</h3>
            <p style="font-size: 12pt; margin-bottom: 6pt;">低秩维度，控制表达能力</p>
            <p style="font-size: 11pt; color: #888;">推荐: 8 / 16 / 32 / 64</p>
          </div>
          <div style="flex: 1; background: #1e2235; padding: 15pt; border-radius: 6pt;">
            <h3 style="font-size: 14pt; color: #B165FB; margin-bottom: 8pt;">alpha (α)</h3>
            <p style="font-size: 12pt; margin-bottom: 6pt;">缩放因子</p>
            <p style="font-size: 11pt; color: #888;">推荐: 通常设为 2×r</p>
          </div>
          <div style="flex: 1; background: #1e2235; padding: 15pt; border-radius: 6pt;">
            <h3 style="font-size: 14pt; color: #40695B; margin-bottom: 8pt;">dropout</h3>
            <p style="font-size: 12pt; margin-bottom: 6pt;">正则化</p>
            <p style="font-size: 11pt; color: #888;">推荐: 0.05 ~ 0.1</p>
          </div>
          <div style="flex: 1; background: #1e2235; padding: 15pt; border-radius: 6pt;">
            <h3 style="font-size: 14pt; color: #40695B; margin-bottom: 8pt;">target_modules</h3>
            <p style="font-size: 12pt; margin-bottom: 6pt;">目标层</p>
            <p style="font-size: 11pt; color: #888;">q/k/v/o_proj</p>
          </div>
        </div>
      </div>
    `
  },
  // Slide 11: PEFT Methods
  {
    bg: 'bg-main.png',
    content: `
      <div style="flex: 1; padding: 30pt;">
        <h2 style="font-size: 24pt; margin-bottom: 18pt;">PEFT 方法族</h2>
        <div style="display: flex; gap: 15pt;">
          <div style="flex: 1; background: #2d1f4a; padding: 15pt; border-radius: 6pt;">
            <h3 style="font-size: 14pt; color: #B165FB; margin-bottom: 8pt;">LoRA</h3>
            <p style="font-size: 11pt;">低秩矩阵分解</p>
            <p style="font-size: 10pt; color: #888; margin-top: 6pt;">通用性最好</p>
          </div>
          <div style="flex: 1; background: #1f3d3d; padding: 15pt; border-radius: 6pt;">
            <h3 style="font-size: 14pt; color: #40695B; margin-bottom: 8pt;">QLoRA</h3>
            <p style="font-size: 11pt;">4-bit 量化 + LoRA</p>
            <p style="font-size: 10pt; color: #888; margin-top: 6pt;">显存最低</p>
          </div>
          <div style="flex: 1; background: #2d1f4a; padding: 15pt; border-radius: 6pt;">
            <h3 style="font-size: 14pt; color: #B165FB; margin-bottom: 8pt;">Adapter</h3>
            <p style="font-size: 11pt;">层间插入模块</p>
            <p style="font-size: 10pt; color: #888; margin-top: 6pt;">有推理开销</p>
          </div>
          <div style="flex: 1; background: #1f3d3d; padding: 15pt; border-radius: 6pt;">
            <h3 style="font-size: 14pt; color: #40695B; margin-bottom: 8pt;">IA³</h3>
            <p style="font-size: 11pt;">激活值缩放</p>
            <p style="font-size: 10pt; color: #888; margin-top: 6pt;">参数最少</p>
          </div>
        </div>
        <div style="margin-top: 18pt; background: #0d0f14; padding: 12pt; border-radius: 4pt;">
          <p style="font-size: 13pt; text-align: center;"><span class="highlight">QLoRA</span> = 4-bit NF4量化 + LoRA + 双重量化 + 分页优化器</p>
        </div>
      </div>
    `
  },
  // Slide 12: Section - Instruction Tuning
  {
    bg: 'bg-section.png',
    content: `
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 30pt;">
        <h1 style="font-size: 28pt; margin-bottom: 15pt;">Part 3</h1>
        <h2 style="font-size: 24pt; color: #FFFFFF;">指令微调与 SFT+RLHF</h2>
      </div>
    `
  },
  // Slide 13: Instruction Tuning
  {
    bg: 'bg-main.png',
    content: `
      <div style="flex: 1; padding: 30pt;">
        <h2 style="font-size: 24pt; margin-bottom: 18pt;">指令微调 Instruction Tuning</h2>
        <div style="display: flex; gap: 20pt;">
          <div style="flex: 1;">
            <h3 style="font-size: 15pt; color: #B165FB; margin-bottom: 12pt;">核心思想</h3>
            <p style="font-size: 13pt; margin-bottom: 15pt;">用 (指令, 输出) 对训练，让模型理解<span class="highlight">任务意图</span></p>
            <div style="background: #0d0f14; padding: 12pt; border-radius: 4pt;">
              <p style="font-size: 12pt; color: #B165FB;">指令: 将以下英文翻译成中文</p>
              <p style="font-size: 12pt; color: #888; margin-top: 6pt;">输入: Hello World</p>
              <p style="font-size: 12pt; color: #40695B; margin-top: 6pt;">输出: 你好世界</p>
            </div>
          </div>
          <div style="flex: 1;">
            <h3 style="font-size: 15pt; color: #40695B; margin-bottom: 12pt;">优势</h3>
            <ul style="font-size: 12pt;">
              <li>零样本泛化能力强</li>
              <li>多任务统一格式</li>
              <li>数据构造相对简单</li>
              <li>与 LoRA 完美结合</li>
            </ul>
          </div>
        </div>
      </div>
    `
  },
  // Slide 14: Section - SFT+RLHF
  {
    bg: 'bg-section.png',
    content: `
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 30pt;">
        <h1 style="font-size: 28pt; margin-bottom: 15pt;">Part 3.1</h1>
        <h2 style="font-size: 24pt; color: #FFFFFF;">SFT + RLHF</h2>
      </div>
    `
  },
  // Slide 15: SFT+RLHF
  {
    bg: 'bg-main.png',
    content: `
      <div style="flex: 1; padding: 30pt;">
        <h2 style="font-size: 24pt; margin-bottom: 18pt;">SFT + RLHF 流程</h2>
        <div style="display: flex; gap: 15pt;">
          <div style="flex: 1; background: #2d1f4a; padding: 15pt; border-radius: 6pt;">
            <h3 style="font-size: 14pt; color: #B165FB; margin-bottom: 8pt;">1. SFT</h3>
            <p style="font-size: 11pt;">监督微调</p>
            <p style="font-size: 10pt; color: #888; margin-top: 6pt;">高质量示例训练</p>
          </div>
          <div style="flex: 1; background: #1f3d3d; padding: 15pt; border-radius: 6pt;">
            <h3 style="font-size: 14pt; color: #40695B; margin-bottom: 8pt;">2. RM</h3>
            <p style="font-size: 11pt;">奖励模型</p>
            <p style="font-size: 10pt; color: #888; margin-top: 6pt;">人类偏好学习</p>
          </div>
          <div style="flex: 1; background: #2d1f4a; padding: 15pt; border-radius: 6pt;">
            <h3 style="font-size: 14pt; color: #B165FB; margin-bottom: 8pt;">3. PPO</h3>
            <p style="font-size: 11pt;">强化学习优化</p>
            <p style="font-size: 10pt; color: #888; margin-top: 6pt;">最大化奖励</p>
          </div>
        </div>
        <div style="margin-top: 15pt; background: #0d0f14; padding: 12pt; border-radius: 4pt;">
          <p style="font-size: 12pt; text-align: center;">替代方案: <span class="highlight">DPO</span> (Direct Preference Optimization) - 无需奖励模型</p>
        </div>
      </div>
    `
  },
  // Slide 16: RLHF Details
  {
    bg: 'bg-main.png',
    content: `
      <div style="flex: 1; padding: 30pt;">
        <h2 style="font-size: 24pt; margin-bottom: 18pt;">RLHF 的挑战与方案</h2>
        <div style="display: flex; gap: 20pt;">
          <div style="flex: 1;">
            <h3 style="font-size: 15pt; color: #B165FB; margin-bottom: 12pt;">挑战</h3>
            <ul style="font-size: 12pt;">
              <li>标注成本高昂</li>
              <li>训练不稳定</li>
              <li>奖励模型偏差</li>
              <li>需要4个模型同时运行</li>
            </ul>
          </div>
          <div style="flex: 1;">
            <h3 style="font-size: 15pt; color: #40695B; margin-bottom: 12pt;">简化方案</h3>
            <ul style="font-size: 12pt;">
              <li><span class="highlight">DPO</span>: 直接偏好优化</li>
              <li><span class="highlight">ORPO</span>: 无需参考模型</li>
              <li><span class="highlight">SimPO</span>: 更简单的优化</li>
            </ul>
          </div>
        </div>
      </div>
    `
  },
  // Slide 17: Section - Prompt Tuning
  {
    bg: 'bg-section.png',
    content: `
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 30pt;">
        <h1 style="font-size: 28pt; margin-bottom: 15pt;">Part 4</h1>
        <h2 style="font-size: 24pt; color: #FFFFFF;">Prompt Tuning</h2>
      </div>
    `
  },
  // Slide 18: Prompt Tuning
  {
    bg: 'bg-main.png',
    content: `
      <div style="flex: 1; padding: 30pt;">
        <h2 style="font-size: 24pt; margin-bottom: 18pt;">Prompt Tuning 原理</h2>
        <div style="display: flex; gap: 20pt;">
          <div style="flex: 1;">
            <h3 style="font-size: 15pt; color: #B165FB; margin-bottom: 12pt;">核心思想</h3>
            <p style="font-size: 13pt; margin-bottom: 15pt;">冻结模型，只学习输入前的<span class="highlight">软提示向量</span></p>
            <div style="background: #0d0f14; padding: 12pt; border-radius: 4pt;">
              <p style="font-family: 'Courier New', monospace; font-size: 12pt; color: #B165FB;">[P1][P2]...[Pn] + input tokens</p>
              <p style="font-size: 11pt; color: #888; margin-top: 6pt;">Pi 是可学习的 embedding</p>
            </div>
          </div>
          <div style="flex: 1;">
            <h3 style="font-size: 15pt; color: #40695B; margin-bottom: 12pt;">特点</h3>
            <ul style="font-size: 12pt;">
              <li>参数量极少 (几千个)</li>
              <li>模型完全冻结</li>
              <li>多任务可共享基座</li>
              <li>效果随规模提升</li>
            </ul>
          </div>
        </div>
      </div>
    `
  },
  // Slide 19: Section - RAG
  {
    bg: 'bg-section.png',
    content: `
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 30pt;">
        <h1 style="font-size: 28pt; margin-bottom: 15pt;">Part 5</h1>
        <h2 style="font-size: 24pt; color: #FFFFFF;">RAG 检索增强生成</h2>
      </div>
    `
  },
  // Slide 20: RAG
  {
    bg: 'bg-main.png',
    content: `
      <div style="flex: 1; padding: 30pt;">
        <h2 style="font-size: 24pt; margin-bottom: 18pt;">RAG 架构</h2>
        <div style="display: flex; gap: 20pt;">
          <div style="flex: 1;">
            <h3 style="font-size: 15pt; color: #B165FB; margin-bottom: 12pt;">工作流程</h3>
            <ol style="font-size: 12pt;">
              <li>用户查询向量化</li>
              <li>向量库相似检索</li>
              <li>Top-K 文档召回</li>
              <li>拼接 context + query</li>
              <li>LLM 生成回答</li>
            </ol>
          </div>
          <div style="flex: 1;">
            <h3 style="font-size: 15pt; color: #40695B; margin-bottom: 12pt;">优势</h3>
            <ul style="font-size: 12pt;">
              <li>无需训练模型</li>
              <li>知识实时更新</li>
              <li>可溯源、可解释</li>
              <li>降低幻觉风险</li>
            </ul>
          </div>
        </div>
      </div>
    `
  },
  // Slide 21: RAG vs Fine-tuning
  {
    bg: 'bg-main.png',
    content: `
      <div style="flex: 1; padding: 30pt;">
        <h2 style="font-size: 24pt; margin-bottom: 18pt;">RAG vs 微调</h2>
        <div style="display: flex; gap: 20pt;">
          <div style="flex: 1; background: #2d1f4a; padding: 15pt; border-radius: 6pt;">
            <h3 style="font-size: 15pt; color: #B165FB; margin-bottom: 10pt;">RAG 适合</h3>
            <ul style="font-size: 11pt;">
              <li>知识频繁更新</li>
              <li>需要可溯源</li>
              <li>事实性问答</li>
              <li>快速上线</li>
            </ul>
          </div>
          <div style="flex: 1; background: #1f3d3d; padding: 15pt; border-radius: 6pt;">
            <h3 style="font-size: 15pt; color: #40695B; margin-bottom: 10pt;">微调适合</h3>
            <ul style="font-size: 11pt;">
              <li>风格/语气定制</li>
              <li>特殊输出格式</li>
              <li>推理能力增强</li>
              <li>专业领域深度</li>
            </ul>
          </div>
        </div>
      </div>
    `
  },
  // Slide 22: Section - Comparison
  {
    bg: 'bg-section.png',
    content: `
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 30pt;">
        <h1 style="font-size: 28pt; margin-bottom: 15pt;">Part 6</h1>
        <h2 style="font-size: 24pt; color: #FFFFFF;">方案对比与选择</h2>
      </div>
    `
  },
  // Slide 23: Comparison Table Section
  {
    bg: 'bg-section.png',
    content: `
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 30pt;">
        <h1 style="font-size: 28pt; margin-bottom: 15pt;">方案对比</h1>
        <h2 style="font-size: 20pt; color: #888;">六种方案核心指标</h2>
      </div>
    `
  },
  // Slide 24: Comparison Table
  {
    bg: 'bg-main.png',
    content: `
      <div style="flex: 1; padding: 30pt;">
        <h2 style="font-size: 22pt; margin-bottom: 15pt;">方案对比表</h2>
        <div style="background: #1e2235; padding: 12pt; border-radius: 6pt; font-size: 11pt;">
          <div style="display: flex; border-bottom: 1px solid #333; padding-bottom: 8pt; margin-bottom: 8pt;">
            <p style="flex: 1.2; color: #B165FB; font-weight: bold;">方案</p>
            <p style="flex: 1; color: #B165FB; font-weight: bold;">参数量</p>
            <p style="flex: 1; color: #B165FB; font-weight: bold;">显存</p>
            <p style="flex: 1; color: #B165FB; font-weight: bold;">效果</p>
          </div>
          <div style="display: flex; margin-bottom: 6pt;">
            <p style="flex: 1.2;">全量微调</p>
            <p style="flex: 1;">100%</p>
            <p style="flex: 1;">极高</p>
            <p style="flex: 1; color: #40695B;">最好</p>
          </div>
          <div style="display: flex; margin-bottom: 6pt;">
            <p style="flex: 1.2;">LoRA</p>
            <p style="flex: 1;">0.1-1%</p>
            <p style="flex: 1;">低</p>
            <p style="flex: 1; color: #40695B;">接近全量</p>
          </div>
          <div style="display: flex; margin-bottom: 6pt;">
            <p style="flex: 1.2;">QLoRA</p>
            <p style="flex: 1;">0.1-1%</p>
            <p style="flex: 1;">更低</p>
            <p style="flex: 1; color: #888;">略低</p>
          </div>
          <div style="display: flex; margin-bottom: 6pt;">
            <p style="flex: 1.2;">Prompt Tuning</p>
            <p style="flex: 1;">~0.01%</p>
            <p style="flex: 1;">最低</p>
            <p style="flex: 1; color: #888;">一般</p>
          </div>
          <div style="display: flex;">
            <p style="flex: 1.2;">RAG</p>
            <p style="flex: 1;">0%</p>
            <p style="flex: 1;">推理时</p>
            <p style="flex: 1; color: #40695B;">依场景</p>
          </div>
        </div>
      </div>
    `
  },
  // Slide 25: Decision Tree
  {
    bg: 'bg-main.png',
    content: `
      <div style="flex: 1; padding: 30pt;">
        <h2 style="font-size: 24pt; margin-bottom: 18pt;">方案选择决策</h2>
        <div style="display: flex; gap: 15pt;">
          <div style="flex: 1;">
            <div style="background: #1e2235; padding: 12pt; border-radius: 6pt; margin-bottom: 10pt;">
              <h3 style="font-size: 12pt; color: #B165FB; margin-bottom: 6pt;">数据量大 + 预算充足?</h3>
              <p style="font-size: 12pt;">→ <span class="highlight">SFT + LoRA</span></p>
            </div>
            <div style="background: #1e2235; padding: 12pt; border-radius: 6pt; margin-bottom: 10pt;">
              <h3 style="font-size: 12pt; color: #40695B; margin-bottom: 6pt;">数据量小 + 快速上线?</h3>
              <p style="font-size: 12pt;">→ <span class="highlight">RAG</span> + 指令微调</p>
            </div>
            <div style="background: #1e2235; padding: 12pt; border-radius: 6pt;">
              <h3 style="font-size: 12pt; color: #B165FB; margin-bottom: 6pt;">显存受限?</h3>
              <p style="font-size: 12pt;">→ <span class="highlight">QLoRA</span></p>
            </div>
          </div>
          <div style="flex: 1;">
            <div style="background: #1e2235; padding: 12pt; border-radius: 6pt; margin-bottom: 10pt;">
              <h3 style="font-size: 12pt; color: #40695B; margin-bottom: 6pt;">知识需实时更新?</h3>
              <p style="font-size: 12pt;">→ <span class="highlight">RAG</span></p>
            </div>
            <div style="background: #1e2235; padding: 12pt; border-radius: 6pt; margin-bottom: 10pt;">
              <h3 style="font-size: 12pt; color: #B165FB; margin-bottom: 6pt;">需要高质量输出?</h3>
              <p style="font-size: 12pt;">→ <span class="highlight">RLHF/DPO</span></p>
            </div>
            <div style="background: #1e2235; padding: 12pt; border-radius: 6pt;">
              <h3 style="font-size: 12pt; color: #40695B; margin-bottom: 6pt;">多任务切换?</h3>
              <p style="font-size: 12pt;">→ <span class="highlight">LoRA</span> 多适配器</p>
            </div>
          </div>
        </div>
      </div>
    `
  },
  // Slide 26: Practice Case
  {
    bg: 'bg-main.png',
    content: `
      <div style="flex: 1; padding: 30pt;">
        <h2 style="font-size: 24pt; margin-bottom: 18pt;">实践案例: NanoBananaPro</h2>
        <div style="display: flex; gap: 20pt;">
          <div style="flex: 1;">
            <h3 style="font-size: 15pt; color: #B165FB; margin-bottom: 12pt;">项目背景</h3>
            <ul style="font-size: 12pt;">
              <li>LoRA 微调 Qwen2.5-3B</li>
              <li>图像生成提示词任务</li>
              <li>6000+ 训练样本</li>
              <li>单 GPU 训练</li>
            </ul>
          </div>
          <div style="flex: 1;">
            <h3 style="font-size: 15pt; color: #40695B; margin-bottom: 12pt;">技术选型</h3>
            <ul style="font-size: 12pt;">
              <li>unsloth 加速框架</li>
              <li>LoRA r=16, alpha=16</li>
              <li>4-bit 量化推理</li>
              <li>Gradio 前端部署</li>
            </ul>
          </div>
        </div>
      </div>
    `
  },
  // Slide 27: Training Config
  {
    bg: 'bg-main.png',
    content: `
      <div style="flex: 1; padding: 30pt;">
        <h2 style="font-size: 24pt; margin-bottom: 18pt;">训练配置示例</h2>
        <div style="background: #0d0f14; padding: 15pt; border-radius: 4pt; font-family: 'Courier New', monospace; font-size: 11pt;">
          <p style="color: #B165FB;">model = FastLanguageModel.get_peft_model(</p>
          <p style="color: #E0E0E0; margin-left: 15pt;">model,</p>
          <p style="color: #E0E0E0; margin-left: 15pt;">r=<span style="color: #40695B;">16</span>,</p>
          <p style="color: #E0E0E0; margin-left: 15pt;">lora_alpha=<span style="color: #40695B;">16</span>,</p>
          <p style="color: #E0E0E0; margin-left: 15pt;">lora_dropout=<span style="color: #40695B;">0</span>,</p>
          <p style="color: #E0E0E0; margin-left: 15pt;">target_modules=[<span style="color: #888;">"q_proj", "k_proj",</span></p>
          <p style="color: #888; margin-left: 30pt;">"v_proj", "o_proj"</span>],</p>
          <p style="color: #B165FB;">)</p>
        </div>
      </div>
    `
  },
  // Slide 28: Section - Summary
  {
    bg: 'bg-section.png',
    content: `
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 30pt;">
        <h1 style="font-size: 28pt; margin-bottom: 15pt;">Part 7</h1>
        <h2 style="font-size: 24pt; color: #FFFFFF;">总结与建议</h2>
      </div>
    `
  },
  // Slide 29: Key Takeaways
  {
    bg: 'bg-main.png',
    content: `
      <div style="flex: 1; padding: 30pt;">
        <h2 style="font-size: 24pt; margin-bottom: 18pt;">核心要点</h2>
        <div style="display: flex; gap: 20pt;">
          <div style="flex: 1;">
            <ul style="font-size: 13pt;">
              <li style="margin-bottom: 12pt;"><span class="highlight">LoRA</span> 是性价比最高的微调方案</li>
              <li style="margin-bottom: 12pt;"><span class="highlight">QLoRA</span> 适合资源受限场景</li>
              <li style="margin-bottom: 12pt;"><span class="highlight">RAG</span> 适合知识密集型应用</li>
            </ul>
          </div>
          <div style="flex: 1;">
            <ul style="font-size: 13pt;">
              <li style="margin-bottom: 12pt;"><span class="highlight">指令微调</span> 提升任务理解</li>
              <li style="margin-bottom: 12pt;"><span class="highlight">RLHF/DPO</span> 保证输出质量</li>
              <li style="margin-bottom: 12pt;"><span class="highlight">混合方案</span> 往往是最佳选择</li>
            </ul>
          </div>
        </div>
      </div>
    `
  },
  // Slide 30: Thank You
  {
    bg: 'bg-cover.png',
    content: `
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 30pt;">
        <h1 style="font-size: 36pt; margin-bottom: 25pt;">Thank You</h1>
        <p style="font-size: 18pt; color: #B165FB; margin-bottom: 20pt;">谢谢聆听</p>
        <p style="font-size: 14pt; color: #888;">Questions & Discussion</p>
      </div>
    `
  }
];

// Generate all slides
slides.forEach((slide, index) => {
  const slideNum = String(index + 1).padStart(2, '0');
  const html = createHTML(slide.bg, slide.content);
  const filePath = path.join(slidesDir, `slide${slideNum}.html`);
  fs.writeFileSync(filePath, html);
});

console.log(`Generated ${slides.length} slides in ${slidesDir}`);
