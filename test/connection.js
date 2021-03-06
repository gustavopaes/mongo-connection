'use strict'

require('dotenv').config()
const expect = require('chai').expect
const DbClass = require('../src/connection.js')

let eventCalled = {
	disconnected: false,
	connecting: false,
	open: false,
	error: false,
	reconnected: false,
	close: false,
}

let config = {
	options: {
        "readPreference": "ReadPreference.SECONDARY_PREFERRED",
        "keepAlive": 1000,
        "connectTimeoutMS": 30000,
        "poolSize": 5,
        "autoReconnect": true,
        "reconnectInterval": 30000,
        "reconnectTries": 240
    }
	
}

const events = {
	disconnected: function(){
		eventCalled.disconnected = true
	},
	open: function(){
		eventCalled.open = true
	},
	error: function(){
		eventCalled.error = true
	},
	reconnected: function(){
		eventCalled.reconnected = true
	},
	close: function(){
		eventCalled.close = true
	}
}

const mongo = new DbClass(config)
mongo.setEvents(events)

describe('Connection', () => {
	it('Should connect to mongo', () => {
		return mongo.connect()
		.then(db => {
	    	expect(db).to.exist
	    	expect(mongo.isConnected).to.equal(true)
	    })
	})

	it('Should disconnect from mongo', () => {
		return mongo.disconnect()
		.then(() => {
	    	expect(mongo.isConnected).to.equal(false)
	    })
	})
})

describe('statics method', () => {
	it('ReadPreference should exists and expose native ReadPreference', () => {
		expect(DbClass.ReadPreference).to.be.a('function')
		expect(DbClass.ReadPreference.PRIMARY).to.be.a('string')
		expect(DbClass.ReadPreference.PRIMARY_PREFERRED).to.be.a('string')
		expect(DbClass.ReadPreference.SECONDARY).to.be.a('string')
		expect(DbClass.ReadPreference.SECONDARY_PREFERRED).to.be.a('string')
		expect(DbClass.ReadPreference.NEAREST).to.be.a('string')
	})
})

describe('Events', () => {
  	beforeEach(() => {
		return mongo.connect()
		.then(db => {
			expect(db).to.exist
			expect(mongo.isConnected).to.equal(true)
		})
	})

	afterEach(() => {
		return mongo.disconnect()
		.then(() => {
	    	expect(mongo.isConnected).to.equal(false)
	    })
	})

  	it('Should call "disconnected" callback on "disconnected" event and set status properly', () => {
		expect(mongo.isConnected).to.equal(true)
		expect(eventCalled.disconnected).to.equal(false)
		mongo.db._events.disconnected()
		expect(mongo.isConnected).to.equal(false)
		expect(eventCalled.disconnected).to.equal(true)
		expect(mongo.count.disconnected).to.be.greaterThan(0)
  	})

  	it('Should call "open" callback on "open" event', () => {		
		expect(eventCalled.open).to.equal(true)
  	})

  	it('Should call "error" callback on "error" event and set status properly', () => {
		expect(mongo.isConnected).to.equal(true)
		expect(eventCalled.error).to.equal(false)
		mongo.db._events.error()
		expect(eventCalled.error).to.equal(true)
		expect(mongo.isConnected).to.equal(false)
		expect(mongo.count.error).to.be.greaterThan(0)
  	})

  	it('Should call "reconnected" callback on "reconnected" event and set status properly', () => {
		expect(eventCalled.reconnected).to.equal(false)
		mongo.db._events.reconnected()
		expect(eventCalled.reconnected).to.equal(true)
		expect(mongo.isConnected).to.equal(true)
		expect(mongo.count.reconnected).to.be.greaterThan(0)
  	})

  	it('Should call "close" callback on "close" event and set status properly', () => {
		expect(mongo.isConnected).to.equal(true)
		mongo.db._events.close()
		expect(mongo.isConnected).to.equal(false)
		expect(mongo.count.error).to.equal(0)
		expect(mongo.count.reconnected).to.equal(0)
		expect(mongo.count.disconnected).to.equal(0)
  	})
})