export default class Timer {
  constructor(root) {
    root.innerHTML = Timer.getHTML();

    this.el = {
      // 显示时间
      minutes: root.querySelector(".timer__part--minutes"),
      seconds: root.querySelector(".timer__part--seconds"),

      // 控制按钮
      control: root.querySelector(".timer__btn--control"),
      reset: root.querySelector(".timer__btn--reset"),
      pomodoro: root.querySelector(".timer__btn--pomodoro"),

      // 输入框
      inputMinutes: root.querySelector(".timer__input--minutes"),
      inputSeconds: root.querySelector(".timer__input--seconds"),

      // 设置弹窗
      settingsOverlay: root.querySelector(".timer__settings-overlay"),
      settingsWorkInput: root.querySelector(".settings__work"),
      settingsBreakInput: root.querySelector(".settings__break"),
      settingsSaveBtn: root.querySelector(".settings__save"),
      settingsCancelBtn: root.querySelector(".settings__cancel"),

      // 顶部按钮
      exitPomodoroBtn: root.querySelector(".timer__btn--exit"),
      muteBtn: root.querySelector(".timer__btn--mute"),

      // 左下角说明
      infoBtn: root.querySelector(".timer__btn--info"),
      infoOverlay: root.querySelector(".timer__info-overlay"),
      infoCloseBtn: root.querySelector(".timer__info-close")
    };

    // --------------------------
    // 初始化状态
    // --------------------------
    this.interval = null;
    this.remainingSeconds = 90;
    this.lastSetSeconds = 90;
    this.audio = new Audio("audio/alarm.mp3");
    this.isPomodoro = false;
    this.isWorkPhase = true;
    this.isMuted = false;

    this.workDuration = 25;
    this.breakDuration = 5;

    this.el.settingsOverlay.classList.add("hidden");
    this.el.exitPomodoroBtn.style.display = "none";
    this.el.infoOverlay.classList.add("hidden");

    this.bindEvents();
    this.updateInterfaceTime();
    this.updateInterfaceControls();
  }

  // ==========================
  // 事件绑定
  // ==========================
  bindEvents() {
    this.el.muteBtn.addEventListener("click", () => this.toggleMute());
    this.el.control.addEventListener("click", () => this.toggleTimer());
    this.el.reset.addEventListener("click", () => this.reset());
    this.el.pomodoro.addEventListener("click", () => this.openSettings());
    this.el.settingsSaveBtn.addEventListener("click", () => this.saveSettings());
    this.el.settingsCancelBtn.addEventListener("click", () => this.closeSettings());
    this.el.exitPomodoroBtn.addEventListener("click", () => this.exitPomodoro());

    // 说明按钮事件
    this.el.infoBtn.addEventListener("click", () => this.openInfo());
    this.el.infoCloseBtn.addEventListener("click", () => this.closeInfo());
  }

  // ==========================
  // 静音切换
  // ==========================
  toggleMute() {
    this.isMuted = !this.isMuted;
    this.el.muteBtn.querySelector("span").textContent = this.isMuted ? "volume_off" : "volume_up";
  }

  // ==========================
  // 开始 / 暂停
  // ==========================
  toggleTimer() {
    const totalSeconds = this.getInputTotalSeconds();
    if (totalSeconds !== null && !this.isPomodoro) {
      this.remainingSeconds = totalSeconds;
      this.lastSetSeconds = totalSeconds;
      this.updateInterfaceTime();
    }
    this.interval ? this.stop() : this.start();
  }

  start() {
    if (this.remainingSeconds === 0 || this.interval) return;

    this.interval = setInterval(() => {
      this.remainingSeconds--;
      this.updateInterfaceTime();
      if (this.remainingSeconds === 0) this.onEnd();
    }, 1000);

    this.updateInterfaceControls();
    this.el.inputMinutes.value = "";
    this.el.inputSeconds.value = "";
  }

  stop() {
    clearInterval(this.interval);
    this.interval = null;
    this.updateInterfaceControls();
  }

  reset() {
    this.stop();
    this.remainingSeconds = this.isPomodoro
      ? (this.isWorkPhase ? this.workDuration * 60 : this.breakDuration * 60)
      : this.lastSetSeconds;
    this.updateInterfaceTime();
  }

  // ==========================
  // 番茄钟设置
  // ==========================
  openSettings() {
    this.el.settingsOverlay.classList.remove("hidden");
    this.el.settingsWorkInput.value = this.workDuration;
    this.el.settingsBreakInput.value = this.breakDuration;
  }

  closeSettings() {
    this.el.settingsOverlay.classList.add("hidden");
  }

  saveSettings() {
    const work = parseInt(this.el.settingsWorkInput.value);
    const rest = parseInt(this.el.settingsBreakInput.value);

    if (isNaN(work) || work < 1 || work > 120 || isNaN(rest) || rest < 1 || rest > 60) {
      alert("请输入有效的工作和休息时间！");
      return;
    }

    this.workDuration = work;
    this.breakDuration = rest;
    this.isPomodoro = true;
    this.isWorkPhase = true;
    this.remainingSeconds = work * 60;

    this.el.pomodoro.classList.add("timer__btn--pomodoro-active");
    this.el.exitPomodoroBtn.style.display = "flex";
    this.closeSettings();
    this.start();
  }

  exitPomodoro() {
    this.isPomodoro = false;
    this.isWorkPhase = true;
    this.remainingSeconds = this.lastSetSeconds;
    this.stop();
    this.el.pomodoro.classList.remove("timer__btn--pomodoro-active");
    this.el.exitPomodoroBtn.style.display = "none";
    this.updateInterfaceTime();
  }

  switchPhase() {
    if (!this.isMuted) {
      this.audio.currentTime = 0;
      this.audio.play();
    }
    this.isWorkPhase = !this.isWorkPhase;
    this.remainingSeconds = this.isWorkPhase ? this.workDuration * 60 : this.breakDuration * 60;
    this.updateInterfaceTime();
    this.start();
  }

  onEnd() {
    this.isPomodoro ? this.switchPhase() : (!this.isMuted && this.audio.play(), this.stop());
  }

  // ==========================
  // 输入处理
  // ==========================
  getInputTotalSeconds() {
    const min = Number(this.el.inputMinutes.value);
    const sec = Number(this.el.inputSeconds.value);
    if (!this.el.inputMinutes.value && !this.el.inputSeconds.value) return null;
    if (!Number.isInteger(min) || !Number.isInteger(sec) || min < 0 || min > 59 || sec < 0 || sec > 59) {
      alert("分钟和秒数必须在0~59之间！");
      return null;
    }
    const total = min * 60 + sec;
    if (total < 1 || total > 3599) { alert("总时间必须在1秒到59分59秒之间！"); return null; }
    return total;
  }

  // ==========================
  // 界面更新
  // ==========================
  updateInterfaceTime() {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    this.el.minutes.textContent = minutes.toString().padStart(2, "0");
    this.el.seconds.textContent = seconds.toString().padStart(2, "0");
    if (this.remainingSeconds <= 3 && this.remainingSeconds > 0) {
      this.el.minutes.parentElement.classList.add("timer__display--warn");
    } else {
      this.el.minutes.parentElement.classList.remove("timer__display--warn");
    }
  }

  updateInterfaceControls() {
    const isRunning = this.interval !== null;
    this.el.control.innerHTML = `<span class="material-icons">${isRunning ? "pause" : "play_arrow"}</span>`;
    this.el.control.classList.toggle("timer__btn--start", !isRunning);
    this.el.control.classList.toggle("timer__btn--stop", isRunning);
  }

  // ==========================
  // 使用说明
  // ==========================
  openInfo() {
    this.el.infoOverlay.classList.remove("hidden");
  }

  closeInfo() {
    this.el.infoOverlay.classList.add("hidden");
  }

  // ==========================
  // HTML 模板
  // ==========================
  static getHTML() {
    return `
      <div class="timer__top-left">
        <button class="timer__btn timer__btn--exit" title="退出番茄模式">
          <span class="material-icons">arrow_back</span>
        </button>
      </div>
      <div class="timer__top-right">
        <button class="timer__btn timer__btn--mute" title="静音提示音">
          <span class="material-icons">volume_up</span>
        </button>
      </div>

      <div class="timer__display">
        <span class="timer__part timer__part--minutes">00</span>
        <span class="timer__part timer__separator">:</span>
        <span class="timer__part timer__part--seconds">00</span>
      </div>

      <div class="timer__inputs">
        <input type="number" class="timer__input--minutes" min="0" max="59" />
        <span class="timer__input-label">分</span>
        <input type="number" class="timer__input--seconds" min="0" max="59" />
        <span class="timer__input-label">秒</span>
      </div>

      <div class="timer__controls">
        <button type="button" class="timer__btn timer__btn--control timer__btn--start">
          <span class="material-icons">play_arrow</span>
        </button>
        <button type="button" class="timer__btn timer__btn--reset" title="重置">
          <span class="material-icons">replay</span>
        </button>
        <button type="button" class="timer__btn timer__btn--pomodoro">
          <img src="images/tomato.png" alt="Pomodoro" class="tomato-icon" />
        </button>
      </div>

      <div class="timer__bottom-left">
        <button type="button" class="timer__btn timer__btn--info" title="使用说明">
          <span class="material-icons">priority_high</span>
        </button>
      </div>

      <!-- 设置弹窗 -->
      <div class="timer__settings-overlay hidden">
        <div class="timer__settings">
          <h3>番茄钟设置</h3>
          <label>工作时间（分钟）：<input type="number" class="settings__work" min="1" max="120" value="25"></label>
          <label>休息时间（分钟）：<input type="number" class="settings__break" min="1" max="60" value="5"></label>
          <div class="settings__buttons">
            <button class="settings__save">开始</button>
            <button class="settings__cancel">取消</button>
          </div>
        </div>
      </div>

      <!-- 使用说明弹窗 -->
      <div class="timer__info-overlay hidden">
        <div class="timer__settings">
          <h3>使用说明</h3>
          <p>1. 设置时间或点击番茄按钮开始工作/休息模式。</p>
          <p>2. 使用播放/暂停控制计时器。</p>
          <p>3. 可静音提示音或重置计时器。</p>
          <button class="timer__info-close timer__btn">
          <span class="material-icons">close</span>
          </button>
        </div>
      </div>
    `;
  }
}
