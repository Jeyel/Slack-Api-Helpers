var optionTempl = "<option value='{{val}}'>{{text}}</option>";
var messageTempl = "<p><b>{{usr}}:</b> {{msg}}</p>";
var dataR;
var users = {};

var PublicChannels  = [];
var PrivateGroups   = [];
var PrivateMessages = [];

AccessEnum =
{
    Public         : 0,
    PrivateGroup   : 1,
    PrivateMessage : 2
}

var StringArray = { 0 : "channels", 1 : "groups", 2 : "im" };
var FolderStringArray = { 0 : "Public Channels", 1 : "Private Groups", 2 : "Private Messages" };
var NamesDictionnary = new Object();

function getList(param)
{
	var token = $("#token").val();

	if (token.trim() == "")
	{
		alert("token can not be empty");
		return;
	}

	waitingDialog.show();
	$("#channels-div").hide();

	$.ajax(
	{
		"url" : "https://slack.com/api/" + param + ".list",
		"method" : "POST",
		"data" :
		{
			"token" : $("#token").val()
		},
		success : function(data)
		{
			if (data["ok"])
			{
				dataR = data;
				$("#channels-select").html("");

				if (param == "channels")
				{
					for (var i = 0; i < dataR.channels.length; i++)
					{
						var channel = dataR.channels[i];
						var html = optionTempl.replace("{{val}}", channel.id).replace("{{text}}", channel.name);
						
						$.post('CreateFile.php', { foldername: "Public Channels", filename: channel.name }, function(result) { });
						$("#channels-select").append(html);
						PublicChannels.push(channel.id);

						NamesDictionnary[channel.id] = channel.name;
					}
				}
				else if (param == "groups")
				{
					for (var i = 0; i < dataR.groups.length; i++)
					{
						var channel = dataR.groups[i];
						var html = optionTempl.replace("{{val}}", channel.id).replace("{{text}}", channel.name);

						$.post('CreateFile.php', { foldername: "Private Groups", filename: channel.name }, function(result) { });
						$("#channels-select").append(html);
						PrivateGroups.push(channel.id);

						NamesDictionnary[channel.id] = channel.name;
					}
				}
				else if (param == "im")
				{
					getUsers(function()
					{ 
						for (var i = 0; i < dataR.ims.length; i++)
						{
							var channel = dataR.ims[i];
							var username = users[channel.user];
							var html = optionTempl.replace("{{val}}", channel.id).replace("{{text}}", username);

							$.post('CreateFile.php', { foldername: "Private Messages", filename: username }, function(result) { });
							$("#channels-select").append(html);
							PrivateMessages.push(channel.id);
						
							NamesDictionnary[channel.id] = username;
						}
					});
				}
				$("#channels-div").show();
			}
			else
			{
				alert("error please look at the console 1");
				console.log(JSON.stringify(data));
				waitingDialog.hide();
			}

			waitingDialog.hide();
		},
		error: function(XMLHttpRequest, textStatus, errorThrown)
		{
			alert(errorThrown);
        }
	});
}

function getHistory() {
	waitingDialog.show();
	getUsers(function() {
		var token = $("#token").val();
		if (token.trim() == "") {
			alert("token can not be empty");
			return;
		}

		var channel = $('#channels-select').find(":selected").val();
		if (channel.trim() == "") {
			alert("channel could not found");
			return;
		}

		var Accessibility;

		// Really best find method ? :D
		for (var itr = 0; itr < PublicChannels.length; itr++)
		{
			if (PublicChannels[itr] == channel)
			{
				Accessibility = AccessEnum.Public;
				break;
			}
		}

		for (var itr = 0; itr < PrivateGroups.length; itr++)
		{
			if (PrivateGroups[itr] == channel)
			{
				Accessibility = AccessEnum.PrivateGroup;
				break;
			}
		}

		for (var itr = 0; itr < PrivateMessages.length; itr++)
		{
			if (PrivateMessages[itr] == channel)
			{
				Accessibility = AccessEnum.PrivateMessage;
				break;
			}
		}

		getAllHistory(token, channel, Accessibility, function(messages) {
			messages.reverse();
			$("#text-result").html("");
			for (var i = 0; i < messages.length; i++) {
				
				var message = messages[i];
				var html = messageTempl.replace("{{usr}}", users[message.user]).replace("{{msg}}", message.text);

				html = html.replace(/<@.*?>/ig, function(user) {
					var id = user.replace("<@", "");
					id = id.replace(">", "");
					console.log("id" + id);
					return (users[id] ? "@" + users[id] : user);
				});

				html = html.replace(/<http.*?>/ig, function(link) {
					var link = link.replace("<", "");
					link = link.replace(">", "");
					return "<a href='" + link + "' target='_blank'>" + link + "</a>";
				});

				$("#text-result").append(html);

				$.post('FillFile.php', { foldername: FolderStringArray[Accessibility], filename: NamesDictionnary[channel], data: html }, function(result) { });
			}
			waitingDialog.hide();
		});
	});
}

var messages = [];
function getAllHistory(token, channel, Accessibility, callback) {
	messages = [];
	var date = null;
	var stringToUse = StringArray[Accessibility];

	(function stepByStep()
	{
		var postData =
		{
			"token" : token,
			"channel" : channel,
			"count" : 1000,
			"inclusive" : 1
		};

		if(date != null)
		{
			postData["latest"] = date;
		}
		
		$.ajax({
			"url" : "https://slack.com/api/" + stringToUse + ".history",
			"method" : "POST",
			"data" : postData,
			success : function(data)
			{
				if (data.messages.length <= 1)
				{
					callback(messages);
				}
				else
				{
					messages = messages.concat(data.messages);
					date = messages[messages.length - 1].ts - 0.000001;
					stepByStep();
				}
			}
		});
	})();
};

function getUsers(callback) {
	var token = $("#token").val();
	if (token.trim() == "") {
		alert("token can not be empty");
		return;
	}
	$.ajax({
		"url" : "https://slack.com/api/users.list",
		"method" : "POST",
		"data" : {
			"token" : token
		},
		success : function(data)
		{
			if (data["ok"])
			{
				var members = data["members"];
				for (var i = 0; i < members.length; i++) {
					var member = members[i];
					users[member.id] = member.name;
				}
				callback();
			}
			else
			{
				console.log(JSON.stringify(data));
			}
		}
	});
}
