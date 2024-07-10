/* 待办详情组件 */

Page({
  // 保存展示待办的 _id 和详细信息
  data: {
    _id: '',
    todo: {
      title: '',
      files: []
    },
    
  },

  onLoad(options) {
    // 保存上一页传来的 _id 字段，用于后续查询待办记录
    if (options.id !== undefined) {
      this.setData({
        _id: options.id
      }, () => {
        // 在setData回调函数中查询数据库
        this.getTodoData();
      });
    }
  },
  
  getTodoData() {
    const db = wx.cloud.database();
    db.collection('todo').where({
      _id: this.data._id
    }).get().then(res => {
      if (res.data.length > 0) {
        const todo = res.data[0];
        const fileIDs = todo.files.map(file => file.id); // 获取所有fileID
        wx.cloud.getTempFileURL({
          fileList: fileIDs,
          success: res => {
            const tempFileURLs = res.fileList.map(file => file.tempFileURL);
            this.setData({
              'todo.files': tempFileURLs // 更新data中的files数组为临时链接数组
            });
          },
          fail: error => {
            console.error('获取图片URL失败', error);
          }
        });
      }
    }).catch(err => {
      console.error('查询待办数据失败', err);
    });
  },

  // 根据 _id 值查询并显示待办数据
  async onShow() {
    if (this.data._id.length > 0) {
      const db = await getApp().database()
      const collection = 'todo' // 直接使用数据库名称
      db.collection(collection).where({
        _id: this.data._id
      }).get().then(res => {
        if (res.data.length > 0) {
          const todo = res.data[0];
          // 获取图片URL
          const promises = todo.files.map(file => {
            return wx.cloud.getTempFileURL({
              fileList: [file.id] // 使用文件ID获取临时网络链接
            });
          });
          Promise.all(promises).then(results => {
            // 将获取到的URL赋值给todo.files
            todo.files = results.map(result => result.fileList[0].tempFileURL);
            this.setData({
              todo
            });
          }).catch(err => {
            console.error('获取图片URL失败', err);
          });
        }
      }).catch(err => {
        console.error('查询待办数据失败', err);
      });
    }
  },
   // 选择并上传文件
   chooseAndUploadFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'image',
      success: res => {
        const filePath = res.tempFiles[0].path;
        if (filePath.match(/\.(jpg|jpeg|png)$/)) {
          this.uploadFile(filePath);
        } else {
          wx.showToast({
            title: '请选择图片文件',
            icon: 'none'
          });
        }
      },
      fail: error => {
        console.error('选择文件失败', error);
      }
    });
  },

  // 上传文件到云存储
  uploadFile(filePath) {
    const cloudPath = 'todo_images/' + Date.now() + '-' + Math.random().toString(36).substring(2, 15) + '.jpg';
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
      success: res => {
        const fileID = res.fileID;
        this.updateTodoFiles(fileID);
      },
      fail: error => {
        console.error('上传图片失败', error);
      }
    });
  },

  // 更新待办的files数组，将新的fileID添加到数据库
  updateTodoFiles(fileID) {
    const db = wx.cloud.database();
    db.collection('todo').doc(this.data._id).update({
      data: {
        files: _.concat([fileID]) // 使用concat方法添加fileID到数组
      },
      success: res => {
        console.log('文件更新成功', res);
        this.onShow(); // 重新加载待办详情以显示新上传的图片
      },
      fail: error => {
        console.error('文件更新失败', error);
      }
    });
  },

  // 跳转响应函数
  toFileList() {
    wx.navigateTo({
      url: '../file/index?id=' + this.data._id,
    })
  },
  
  toEditPage() {
    wx.navigateTo({
      url: '../edit/index?id=' + this.data._id,
    })
  }

})