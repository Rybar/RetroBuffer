var Vec2d = {
	x: 1,
	y: 0,

	create: function(x, y) {
		var obj = Object.create(this);
		obj.x = x;
		obj.y = y;
		return obj;
	},

	setAngle: function(angle) {
		var length = this.getLength();
		this.x = Math.cos(angle) * length;
		this.y = Math.sin(angle) * length;
	},

	getAngle: function() {
		return Math.atan2(this.y, this.x);
	},

	setLength: function(length) {
		var angle = this.getAngle();
		this.x = Math.cos(angle) * length;
		this.y = Math.sin(angle) * length;
	},

	getLength: function() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	},

	add: function(v2) {
		return vector.create(this.x + v2.getX(), this.y + v2.getY());
	},

	subtract: function(v2) {
		return vector.create(this.x - v2.getX(), this.y - v2.getY());
	},

	multiply: function(val) {
		return vector.create(this.x * val, this.y * val);
	},

	divide: function(val) {
		return vector.create(this.x / val, this.y / val);
	},

	addTo: function(v2) {
		this.x += v2.getX();
		this.y += v2.getY();
	},

	subtractFrom: function(v2) {
		this.x -= v2.getX();
		this.y -= v2.getY();
	},

	multiplyBy: function(val) {
		this.x *= val;
		this.y *= val;
	},

	divideBy: function(val) {
		this.x /= val;
		this.y /= val;
	}
};