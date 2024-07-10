/* 新增待办页面 */

Page({
  // 保存编辑中待办的信息
  data: {
    title: '',
    desc: '',
    files: [],
    fileName: '',
    // freqOptions: ['未完成', '已完成'],
    freq: 0
  },

  // 表单输入处理函数
  onTitleInput(e) {
    this.setData({
      title: e.detail.value
    })
  },

  onDescInput(e) {
    this.setData({
      desc: e.detail.value
    })
  },

  // 上传新附件
  async addFile() {
    // 限制附件个数
    if (this.data.files.length + 1 > getApp().globalData.fileLimit) {
      wx.showToast({
        title: '数量达到上限',
        icon: 'error',
        duration: 2000
      })
      return
    }
    wx.chooseMessageFile({
      count: 1,
      type: 'image',
      success: res => {
        // 获取选择的文件路径
        const filePath = res.tempFiles[0].path;
    
        // 检查文件类型（这里假设只允许jpg和png图片）
        if (filePath.match(/\.(jpg|jpeg|png)$/)) {
          // 上传图片
          wx.cloud.uploadFile({
            cloudPath: 'example.jpg', // 上传至云端的路径
            filePath: filePath, // 小程序临时文件路径
            success: res => {
              // 返回文件 ID
              console.log(res.fileID)
            },
            fail: error => {
              // handle error
              console.error('上传图片失败', error);
            }
          })
        } else {
          // 不允许上传非图片文件
          wx.showToast({
            title: '请选择图片文件',
            icon: 'none'
          });
        }
      },
      fail: error => {
        // handle error
        console.error('选择文件失败', error);
      }
    })
  },

  // 响应事件状态选择器
  onChooseFreq(e) {
    this.setData({
      freq: e.detail.value
    })
  },

  // 保存待办
  async saveTodo() {
    // 对输入框内容进行校验
    if (this.data.title === '') {
      wx.showToast({
        title: '事项标题未填写',
        icon: 'error',
        duration: 2000
      })
      return
    }
    if (this.data.title.length > 300) {
      wx.showToast({
        title: '事项标题过长',
        icon: 'error',
        duration: 2000
      })
      return
    }
    if (this.data.desc.length > 1000000) {
      wx.showToast({
        title: '事项描述过长',
        icon: 'error',
        duration: 2000
      })
      return
    }
    const db = await getApp().database()
    // 在数据库中新建待办事项，并填入已编辑对信息
    db.collection(getApp().globalData.collection).add({
      data: {
        title: this.data.title,       // 待办标题
        desc: this.data.desc,         // 待办描述
        files: this.data.files,       // 待办附件列表
        freq: Number(this.data.freq), // 待办完成情况（提醒频率）
        star: false
      }
    }).then(() => {
      wx.navigateBack({
        delta: 0,
      })
    })
  },

  // 重置所有表单项
  resetTodo() {
    this.setData({
      title: '',
      desc: '',
      files: [],
      fileName: '',
      // freqOptions: ['未完成', '已完成'],
      freq: 0
    })
  }
})