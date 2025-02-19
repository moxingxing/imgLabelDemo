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
      <el-tag v-for="(tag, index) in label" @close="handleRemove(index)" :key="tag.startY" closable size="small" :style="{
          top: `${tag.startY * markScale + imagePosition.y - 20}px`,
          left: `${tag.startX * markScale + imagePosition.x + 35}px`,
        }">
        {{ tag.text }}
      </el-tag>
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
            placeholder="请输入内容"
            v-model="makeName"
            size="mini"
            clearable
          >
            <template slot="prepend">害虫名称</template>
          </el-input>
          <el-button type="primary" size="mini" @click="confirmAdd"
            >确定</el-button
          >
          <el-button size="mini" @click="cancelAdd">取消</el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      label:
        '[{"text":"金龟子","startX":620,"startY":340,"width":141,"height":115},{"text":"夜蛾","startX":488,"startY":495,"width":115,"height":116}]',
      imageUrl:
        "http://bigdata-image.oss-accelerate.aliyuncs.com/Basics/cbd/861551053998357/2023/11/2/192.168.1.108_01_20231102025510657_ALARM_INPUT.jpg",
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
    console.log(JSON.parse(this.label));
    this.label = JSON.parse(this.label);
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
        this.drawLabels(); // 绘制标签信息
      });
    },
    // 移除标签
    handleRemove(index) {
      this.label.splice(index, 1);
      this.drawImage(); // 重新绘制
      this.$nextTick(() => {
        this.drawLabels(); // 绘制标签信息
      });
    },
    // 绘制标签信息
    drawLabels() {
      const canvas = this.$refs.canvas;
      const ctx = canvas.getContext("2d");
      // 绘制每个标签
      this.label.forEach((label) => {
        const { text, startX, startY, width, height } = label;

        // 根据缩放比例调整坐标和尺寸
        const scaledX = startX * this.markScale + this.imagePosition.x;
        const scaledY = startY * this.markScale + this.imagePosition.y;
        const scaledWidth = width * this.markScale;
        const scaledHeight = height * this.markScale;

        // 绘制矩形
        ctx.beginPath();
        ctx.rect(scaledX, scaledY, scaledWidth, scaledHeight);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "red";
        // ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
        // ctx.fill();
        ctx.stroke();

        // 绘制文本
        // ctx.font = "12px Arial";
        // ctx.fillStyle = "red";
        // ctx.fillText(`X ${text}`, scaledX, scaledY - 10); // 绘制文本，偏移矩形框
      });
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
    // 完成绘制或移动
    endAction(event) {
      if (this.isDrawing) {
        this.showMakerInput = true;
        this.markLeft = event.offsetX + 39;
        this.markTop = event.offsetY;
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
  max-width: 1000px;
  margin: 0 auto;
}

.controls {
  margin-bottom: 10px;
}

.canvas {
  border: 1px solid #ccc;
  background-color: #fff;
  display: block;
  margin: 0 auto;
}

.image-container {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 70vh; /* 可以根据需要设置容器的高度 */
}
.tipInfo, .el-tag {
  position: absolute;
  z-index: 2;
}
.contentBox {
  display: flex;
}
</style>
