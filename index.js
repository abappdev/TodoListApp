const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const ld = require('lodash')

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))

var url =
  'mongodb+srv://TodoListUser:' +
  encodeURIComponent('TodoListPassword#2022') +
  '@todolistdb.azvhmjh.mongodb.net/?retryWrites=true&w=majority'

mongoose.connect(url, {
  useNewUrlParser: true,
})

var items = ['Buy Food', 'Cook Food', 'Eat Food']
var workItems = []

const itemSchema = {
  name: String,
}

const Item = mongoose.model('Item', itemSchema)

const itemA = new Item({
  name: 'Buy Food',
})

const itemB = new Item({
  name: 'Cook Food',
})

const itemC = new Item({
  name: 'Eat Food',
})

const defaultItems = [itemA, itemB, itemC]

const listSchema = {
  name: String,
  items: [itemSchema],
}

const List = mongoose.model('List', listSchema)

//Routes
app.get('/', function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err)
        } else {
          console.log('Successfully saved default items to DB')
        }
      })
      res.redirect('/')
    } else {
      res.render('list', {
        listtitle: 'Today',
        newItemList: foundItems,
      })
    }
  })
})

app.post('/', function (req, res) {
  var itemName = req.body.newItem
  var listName = req.body.addbtn

  const item = new Item({
    name: itemName,
  })

  if (listName === 'Today') {
    item.save()
    res.redirect('/')
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item)
      foundList.save()
      res.redirect('/' + listName)
    })
  }
})

app.get('/:listtype', function (req, res) {
  const customListName = ld.capitalize(req.params.listtype)

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        })

        list.save()
        res.redirect('/' + customListName)
      } else {
        console.log('List  found')
        res.render('list', {
          listtitle: foundList.name,
          newItemList: foundList.items,
        })
      }
    } else {
      console.log(err)
    }
  })

  console.log(req.params.listtype)
})

app.get('/about', function (req, res) {
  res.render('about')
})

app.post('/delete', function (req, res) {
  const checkedItemId = req.body.checkbox
  const listName = ld.capitalize(req.body.listname)
  if (listName === 'Today') {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (err) {
        console.log(err)
      } else {
        console.log('Successfully deleted checked item')
        res.redirect('/')
      }
    })
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect('/' + listName)
        } else {
          console.log(err)
        }
      },
    )
  }
})

//Listener
app.listen(3000, function () {
  console.log('TodoList  app listening on port 3000!')
})
