<template>
  <div class="container">
    <div class="controls">
      <el-button
        @click="setMode('draw')"
        :type="mode == 'draw' ? 'primary' : ''"
        >标注</el-button
      >
      <el-button
        @click="setMode('move')"
        :type="mode == 'move' ? 'primary' : ''"
        >抓手</el-button
      >
      <el-button @click="saveImage">保存图片</el-button>
      <el-button @click="saveLabel">保存标注</el-button>
      <div>当前缩放: {{ (scale * 100).toFixed(0) }}%</div>
    </div>
    <div class="image-container" ref="imageContainer" @wheel="zoomImage">
      <canvas
        ref="canvas"
        class="canvas"
        :width="canvasWidth"
        :height="canvasHeight"
        @mousedown="startAction"
        @mousemove="doAction"
        @mouseup="endAction"
        @mouseleave="endAction"
        :style="{ cursor: cursorStyle }"
      ></canvas>
      <div v-if="showText">
        <el-link
          v-for="(tag, index) in label"
          @click="handleRemove(index)"
          :key="`key${tag.text}${index}`"
          size="small"
          :underline="false"
          :style="{
            top: `${tag.startY * markScale + imagePosition.y - 24}px`,
            left: `${tag.startX * markScale + imagePosition.x}px`,
            color: colorText[tag.text],
          }"
        >
        X {{ tag.text }}
        </el-link>
      </div>
      <el-card
        class="tipInfo"
        v-if="showMakerInput"
        :style="{
          top: markTop + 'px',
          left: markLeft + 'px',
        }"
      >
        <div class="contentBox">
          <el-input
            placeholder="请输入"
            v-model="makeName"
            size="mini"
            clearable
          >
            <template slot="prepend">害虫名称</template>
          </el-input>
          <div class="btnBox">
            <el-button type="primary" size="mini" @click="confirmAdd"
              >确定</el-button
            >
            <el-button size="mini" @click="cancelAdd">取消</el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import CBD_PEST_LIBRARAY from "./cbd_pest_library";
export default {
  data() {
    return {
      colorList:[
        '#FF0000',
        '#00FFC2',
        '#FF00A8',
        '#120080',
        '#BDFF00',
        '#FFB800',
        '#5E8000',
        '#FF5C00',
        '#00FF75',
        '#00F0FF',
        '#0094FF',
        '#FFFFFF',
        '#007880',
        '#00C2FF',
        '#C74C4C',
        '#EB00FF',
        '#000000',
        '#002B80',
        '#008061',
        '#FF007A',
        '#006180',
        '#2400FF',
        '#0057FF',
        '#800054',
        '#00803B',
        '#802E00',
        '#004A80',
        '#80003D',
        '#003327',
        '#805C00',
      ],
      colorText:{},
      showText:false,
      aiLabel: "[{'158': [4708, 844, 5040, 1160, 1.0]}, {'158': [4294, 812, 4646, 1100, 1.0]}, {'71': [2920, 66, 3266, 274, 1.0]}, {'71': [838, 302, 1060, 634, 0.99]}, {'158': [1766, 2448, 2094, 2668, 0.99]}, {'71': [1874, 16, 2210, 244, 0.99]}, {'158': [4756, 1836, 5092, 2054, 0.99]}, {'71': [212, 1066, 504, 1362, 0.99]}, {'158': [1868, 762, 2164, 1032, 0.99]}, {'158': [2574, 3018, 2880, 3330, 0.99]}, {'158': [3406, 1126, 3746, 1374, 0.99]}, {'158': [2380, 1174, 2722, 1434, 0.99]}, {'158': [2700, 3152, 3024, 3382, 0.99]}, {'158': [2074, 1406, 2388, 1676, 0.99]}, {'71': [1454, 1502, 1702, 1808, 0.99]}, {'158': [452, 1300, 736, 1570, 0.98]}, {'158': [2898, 1944, 3146, 2262, 0.98]}, {'71': [1646, 1066, 1850, 1416, 0.98]}, {'158': [2750, 2186, 3080, 2472, 0.98]}, {'158': [1414, 1098, 1610, 1420, 0.97]}, {'158': [414, 1536, 756, 1770, 0.97]}, {'158': [2556, 1920, 2894, 2154, 0.96]}, {'158': [2590, 2194, 2782, 2514, 0.96]}, {'158': [1302, 1922, 1604, 2128, 0.96]}, {'260': [1414, 2768, 1486, 2900, 0.94]}, {'71': [1334, 498, 1714, 802, 0.93]}, {'260': [730, 2464, 814, 2580, 0.92]}, {'260': [3528, 454, 3602, 568, 0.91]}, {'260': [4148, 3162, 4254, 3246, 0.86]}, {'260': [4034, 1856, 4110, 1992, 0.86]}, {'260': [5024, 724, 5088, 840, 0.79]}, {'260': [1152, 2532, 1238, 2616, 0.75]}, {'158': [3452, 2194, 3684, 2452, 0.73]}, {'260': [4024, 380, 4104, 492, 0.72]}, {'260': [5252, 110, 5366, 194, 0.68]}, {'260': [2150, 1820, 2244, 1914, 0.66]}, {'260': [3626, 2092, 3732, 2166, 0.66]}, {'260': [350, 1706, 434, 1806, 0.59]}, {'21': [4410, 2494, 4496, 2574, 0.5]}, {'260': [1278, 1892, 1390, 1944, 0.48]}, {'260': [1136, 1638, 1214, 1748, 0.4]}, {'158': [5274, 2434, 5472, 2644, 0.39]}, {'71': [3960, 312, 4060, 426, 0.38]}, {'21': [2142, 1760, 2242, 1850, 0.35]}, {'21': [3994, 728, 4076, 846, 0.34]}, {'260': [3196, 2558, 3314, 2628, 0.33]}, {'21': [1514, 914, 1576, 1036, 0.31]}]",
      label:'[{"text":"金龟子","startX":620,"startY":340,"width":141,"height":115},{"text":"夜蛾","startX":488,"startY":495,"width":115,"height":116}]',
      // imageUrl:"https://bigdata-image.oss-cn-hangzhou.aliyuncs.com/bzy_photo/860048072330218/2025/2/18/192.168.100.100_01_19700510061241836_ALARM_INPUT.jpg",  // 孢子仪
      // imageUrl:"https://bigdata-image.oss-cn-hangzhou.aliyuncs.com/Basics/cbd/866547058632772/2024/7/3/192.168.1.148_01_20240703141128040_ALARM_INPUT.jpg", // 测报灯
      // imageUrl:"https://bigdata-image.oss-cn-hangzhou.aliyuncs.com/Basics/xct/9786b3a8a56032a5/2025/2/20/9786b3a8a56032a5-20250220-102429-3000.000000.jpg", //吸虫塔
      imageUrl:"https://bigdata-image.oss-cn-hangzhou.aliyuncs.com/Basics/cbd/867435059571471/2021/8/21/20210821224659808986.jpg", //水稻
      scale: 1,
      markScale: 1,
      baseScale: 0.31,
      showMakerInput: false,
      makeName: "",
      markTop: 0,
      markLeft: 0,
      mode: "draw", // 默认是标注模式
      startX: 0,
      startY: 0,
      isDrawing: false,
      isMoving: false,
      rectangles: [],
      currentRect: {},
      imagePosition: { x: 0, y: 0 },
      img: null,
      canvasWidth: 800, // 画布宽度
      canvasHeight: 500, // 画布高度
      cursorStyle: "crosshair", // 默认鼠标样式为十字架
    };
  },
  mounted() {
    // console.log(JSON.parse(this.aiLabel.replace(/'/g, '"')));
    this.label = JSON.parse(this.label);
    this.aiLabel = JSON.parse(this.aiLabel.replace(/'/g, '"'));
    this.loadImage();
    window.addEventListener("resize", this.updateCanvasSize); // 监听窗口尺寸变化
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.updateCanvasSize); // 移除监听
  },
  methods: {
    // 加载图片并绘制
    loadImage() {
      const img = new Image();
      img.src = this.imageUrl;
      img.crossOrigin = "anonymous"; // 或者 use-credentials
      img.onload = () => {
        this.img = img;
        this.updateCanvasSize(); // 更新画布大小
        this.drawImage();
        this.$nextTick(() => {
          this.drawLabels(); // 绘制标签信息
        });
      };
    },
    // 更新画布大小
    updateCanvasSize() {
      const container = this.$refs.imageContainer;
      const containerWidth = container.offsetWidth; // 获取容器宽度
      const containerHeight = container.offsetHeight; // 获取容器高度

      // 计算图片的宽高比
      const imgWidth = this.img.width;
      const imgHeight = this.img.height;

      // 计算图片的最大显示尺寸
      if (imgWidth / imgHeight > containerWidth / containerHeight) {
        // 如果图片宽高比大于容器的宽高比，按照容器宽度来缩放
        this.scale = containerWidth / imgWidth; // 按宽度缩放
      } else {
        // 如果图片宽高比小于容器的宽高比，按照容器高度来缩放
        this.scale = containerHeight / imgHeight; // 按高度缩放
      }
      // 以前图片存储数据按照以下比例来的 0.4 0.31 0.25
      if (this.img.width >= 5000) {
        this.markScale = 1 - (0.25 - this.scale) / 0.25;
        this.baseScale = 0.25;
      } else if (this.img.width >= 4000) {
        this.markScale = 1 - (0.31 - this.scale) / 0.31;
        this.baseScale = 0.31;
      } else if (this.img.width < 4000) {
        this.markScale = 1 - (0.4 - this.scale) / 0.4;
        this.baseScale = 0.4;
      }
      this.canvasHeight = this.img.height * this.scale; // 按宽度缩放
      this.canvasWidth = this.img.width * this.scale; // 按宽度缩放
      this.drawImage(); // 更新画布
      this.$nextTick(() => {
      // 处理AI标注数据
      this.aiLabel.forEach((item) => {
        for (let key in item) {
          const [startX, startY, endX, endY, score] = item[key];
          const width = endX - startX;
          const height = endY - startY;
          const text = CBD_PEST_LIBRARAY[key];
          this.label.push({
            text: text,
            startX: (startX * this.scale) / this.markScale,
            startY: (startY * this.scale) / this.markScale,
            width: (width * this.scale) / this.markScale,
            height: (height * this.scale) / this.markScale,
          });
        }
      });
      this.drawLabels(); // 绘制标签信息
      });
    },
    // 移除标签
    handleRemove(index) {
      this.label.splice(index, 1);
      this.drawImage(); // 重新绘制
      this.$nextTick(() => {
        this.drawLabels('remove'); // 绘制标签信息
      });
    },
    // 绘制标签信息
    drawLabels(type = undefined) {
      const canvas = this.$refs.canvas;
      const ctx = canvas.getContext("2d");
      let colorLabel = this.colorText;
      console.log(this.label);
      // 绘制每个标签
      this.label.forEach((label) => {
        const { text, startX, startY, width, height } = label;
        if(colorLabel[text] === undefined) {
          colorLabel[text] = this.colorList[Object.keys(colorLabel).length % this.colorList.length];
        }
        // 根据缩放比例调整坐标和尺寸
        const scaledX = startX * this.markScale + this.imagePosition.x;
        const scaledY = startY * this.markScale + this.imagePosition.y;
        const scaledWidth = width * this.markScale;
        const scaledHeight = height * this.markScale;

        // 绘制矩形
        ctx.beginPath();
        ctx.rect(scaledX, scaledY, scaledWidth, scaledHeight);
        ctx.lineWidth = 2;
        ctx.strokeStyle = colorLabel[text];
        // ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
        // ctx.fill();
        ctx.stroke();

        // 绘制文本
        // ctx.font = "12px Arial";
        // ctx.fillStyle = "red";
        // ctx.fillText(`X ${text}`, scaledX, scaledY - 10); // 绘制文本，偏移矩形框
      });
      this.colorText = colorLabel;
      this.showText = true;
    },
    // 切换标注或抓手模式
    setMode(mode) {
      this.mode = mode;
      if (mode === "draw") {
        this.cursorStyle = "crosshair"; // 标注模式时鼠标变为十字架
      } else if (mode === "move") {
        this.cursorStyle = "grab"; // 抓手模式时鼠标变为手型
      }
    },
    // 绘图
    drawImage() {
      const canvas = this.$refs.canvas;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height); // 清空画布
      this.$nextTick(() => {
        // 绘制图片
        ctx.drawImage(
          this.img,
          this.imagePosition.x,
          this.imagePosition.y,
          this.img.width * this.scale,
          this.img.height * this.scale
        );
        // console.log(this.rectangles);
        // 绘制矩形框
        // this.rectangles.forEach((rect) => {
        //   ctx.beginPath();
        //   ctx.rect(
        //     rect.x * this.scale + this.imagePosition.x,
        //     rect.y * this.scale + this.imagePosition.y,
        //     rect.width * this.scale,
        //     rect.height * this.scale
        //   );
        //   ctx.lineWidth = 2;
        //   ctx.strokeStyle = "red";
        //   // ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
        //   // ctx.fill();
        //   ctx.stroke();
        // });

        // 绘制当前正在绘制的矩形框
        if (this.isDrawing) {
          ctx.beginPath();
          ctx.rect(
            this.currentRect.x * this.scale + this.imagePosition.x,
            this.currentRect.y * this.scale + this.imagePosition.y,
            this.currentRect.width * this.scale,
            this.currentRect.height * this.scale
          );
          ctx.lineWidth = 2;
          ctx.strokeStyle = "red";
          // ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
          // ctx.fill();
          ctx.stroke();
        }
      });
    },
    // 开始绘制或移动图片
    startAction(event) {
      const canvasRect = this.$refs.canvas.getBoundingClientRect();
      const offsetX = event.clientX - canvasRect.left;
      const offsetY = event.clientY - canvasRect.top;

      // 缩放时将坐标转换为实际图像坐标
      const scaledX = (offsetX - this.imagePosition.x) / this.scale;
      const scaledY = (offsetY - this.imagePosition.y) / this.scale;

      if (this.mode === "move") {
        // 启动图片移动
        this.startX = offsetX;
        this.startY = offsetY;
        this.isMoving = true;
      } else if (this.mode === "draw") {
        // 启动绘制矩形
        this.startX = scaledX;
        this.startY = scaledY;

        this.isDrawing = true;
        this.currentRect = {
          x: this.startX,
          y: this.startY,
          width: 0,
          height: 0,
        };
      }
    },
    // 绘制或移动
    doAction(event) {
      const canvasRect = this.$refs.canvas.getBoundingClientRect();
      const offsetX = event.clientX - canvasRect.left;
      const offsetY = event.clientY - canvasRect.top;

      // 缩放时将坐标转换为实际图像坐标
      const scaledX = (offsetX - this.imagePosition.x) / this.scale;
      const scaledY = (offsetY - this.imagePosition.y) / this.scale;

      if (this.isDrawing) {
        // 更新矩形坐标
        this.currentRect.width = scaledX - this.startX;
        this.currentRect.height = scaledY - this.startY;

        // 确保矩形方向正确
        if (this.currentRect.width < 0) {
          this.currentRect.x = scaledX;
          this.currentRect.width = Math.abs(this.currentRect.width);
        }
        if (this.currentRect.height < 0) {
          this.currentRect.y = scaledY;
          this.currentRect.height = Math.abs(this.currentRect.height);
        }

        // 限制矩形绘制在图像区域内
        this.currentRect.x = Math.max(
          0,
          Math.min(this.currentRect.x, this.img.width)
        );
        this.currentRect.y = Math.max(
          0,
          Math.min(this.currentRect.y, this.img.height)
        );
        this.currentRect.width = Math.min(
          this.img.width - this.currentRect.x,
          this.currentRect.width
        );
        this.currentRect.height = Math.min(
          this.img.height - this.currentRect.y,
          this.currentRect.height
        );

        this.drawImage(); // 实时绘制矩形
        this.$nextTick(() => {
          this.drawLabels(); // 绘制标签信息
        });
      }

      // 移动图片
      if (this.isMoving) {
        const deltaX = offsetX - this.startX;
        const deltaY = offsetY - this.startY;
        this.imagePosition.x += deltaX;
        this.imagePosition.y += deltaY;
        this.startX = offsetX;
        this.startY = offsetY;
        this.drawImage(); // 重新绘制
        this.$nextTick(() => {
          this.drawLabels(); // 绘制标签信息
        });
      }
    },
    cancelAdd() {
      this.showMakerInput = false;
      this.makeName = "";
    },
    // 保存所画区域
    confirmAdd() {
      this.showMakerInput = false;
      let newRect = {
        text: this.makeName,
        startX: (this.currentRect.x * this.scale) / this.markScale,
        startY: (this.currentRect.y * this.scale) / this.markScale,
        width: (this.currentRect.width * this.scale) / this.markScale,
        height: (this.currentRect.height * this.scale) / this.markScale,
      };
      this.label.push(newRect);
      console.log(this.rectangles);
      this.currentRect = {};
      this.drawImage(); // 重新绘制
      this.$nextTick(() => {
        this.drawLabels(); // 绘制标签信息
        this.makeName = "";
      });
    },
    // 提交标注
    saveLabel() {
      console.log(this.label);
    },
    // 完成绘制或移动
    endAction(event) {
      if (this.isDrawing) {
        this.showMakerInput = true;
        this.markLeft = event.offsetX;
        this.markTop = event.offsetY;
        if(this.markTop > this.canvasHeight - 110) {
          this.markTop = this.markTop - 110;
        }
        if(this.markLeft > this.canvasWidth - 290) {
          this.markLeft = this.markLeft - 290;
        }
        this.rectangles.push(this.currentRect); // 保存矩形
        this.isDrawing = false;
      }
      if (this.isMoving) {
        this.isMoving = false;
      }
    },
    // 鼠标滚轮缩放
    zoomImage(event) {
      event.preventDefault();
      const delta = event.deltaY;
      if (delta < 0) {
        this.scale += 0.05;
        this.markScale += 0.05 / this.baseScale;
      } else {
        this.scale -= 0.05;
        this.markScale -= 0.05 / this.baseScale;
      }
      if (this.scale < 0.1) {
        this.scale = 0.1;
        this.markScale = 0.1 / this.baseScale;
      }
      if (this.scale > 5) {
        this.scale = 5;
        this.markScale = 5 / this.baseScale;
      }
      this.drawImage(); // 更新缩放后的图像
      this.$nextTick(() => {
        this.drawLabels(); // 绘制标签信息
      });
    },
    // 保存图片
    saveImage() {
      const canvas = this.$refs.canvas;
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "image_with_annotations.png";
      link.click();
    },
  },
};
</script>

<style scoped>
.container {
  width: 100%;
  margin: 0 auto;
}

.controls {
  margin-bottom: 10px;
}

.canvas {
  border: 1px solid #ccc;
  background-color: #fff;
  display: block;
  /* margin: 0 auto; */
}

.image-container {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 70vh; /* 可以根据需要设置容器的高度 */
}
.tipInfo,
.el-link {
  position: absolute;
  z-index: 2;
  /* transform: translateX(50%); */
}
.contentBox {
  width: 250px;
}
.btnBox {
  margin-top: 10px;
}
</style>
